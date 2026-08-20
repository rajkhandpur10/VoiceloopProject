import OpenAI from "openai";
import { REVIEW_THEMES, SENTIMENTS, isReviewAnalysis, type ReviewAnalysis } from "@/lib/ai/review-analysis";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "gpt-4o-mini";
const AI_BATCH_SIZE = 8;
const MAX_REVIEWS_PER_REQUEST = 50;
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const requests = new Map<string, { count: number; resetAt: number }>();

type ReviewRow = { id: string; review_text: string };

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: "OpenAI is not configured. Add OPENAI_API_KEY to .env.local." }, { status: 503 });
    }

    const clientAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    if (isRateLimited(clientAddress)) {
      return Response.json({ error: "Too many analysis requests. Please wait a minute and try again." }, { status: 429 });
    }

    const body: unknown = await request.json().catch(() => null);
    const ids = readIds(body);
    if (!ids) {
      return Response.json({ error: `Provide between 1 and ${MAX_REVIEWS_PER_REQUEST} unique review IDs.` }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("id,review_text")
      .in("id", ids)
      .is("theme", null)
      .is("sentiment", null);
    if (error) throw new Error(`Reviews could not be loaded: ${error.message}`);

    const reviews = (data ?? []) as ReviewRow[];
    const failures: Array<{ ids: string[]; message: string }> = [];
    let analyzed = 0;

    for (let index = 0; index < reviews.length; index += AI_BATCH_SIZE) {
      const batch = reviews.slice(index, index + AI_BATCH_SIZE);
      try {
        const results = await analyzeBatch(batch);
        for (const result of results) {
          const { error: updateError } = await supabase.rpc("update_review_analysis", {
            p_id: result.id,
            p_theme: result.theme,
            p_sentiment: result.sentiment.toLowerCase(),
          });
          if (updateError) {
            failures.push({ ids: [result.id], message: `Database update failed: ${updateError.message}` });
          } else {
            analyzed += 1;
          }
        }
      } catch (batchError) {
        failures.push({ ids: batch.map((review) => review.id), message: errorMessage(batchError) });
      }
    }

    const skipped = ids.length - reviews.length;
    const status = failures.length && analyzed === 0 ? 502 : 200;
    return Response.json({ analyzed, skipped, failed: failures.reduce((sum, item) => sum + item.ids.length, 0), failures }, { status });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

async function analyzeBatch(reviews: ReviewRow[]): Promise<ReviewAnalysis[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const expectedIds = new Set(reviews.map((review) => review.id));
  const response = await openai.responses.create({
    model: MODEL,
    instructions: "Classify each restaurant review by its single dominant theme and overall sentiment. Use only the supplied theme and sentiment choices. Return one result for every input ID and never alter an ID.",
    input: JSON.stringify(reviews),
    text: {
      format: {
        type: "json_schema",
        name: "restaurant_review_analysis",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            results: {
              type: "array",
              minItems: reviews.length,
              maxItems: reviews.length,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  id: { type: "string" },
                  theme: { type: "string", enum: [...REVIEW_THEMES] },
                  sentiment: { type: "string", enum: [...SENTIMENTS] },
                },
                required: ["id", "theme", "sentiment"],
              },
            },
          },
          required: ["results"],
        },
      },
    },
  });

  const parsed: unknown = JSON.parse(response.output_text);
  const results = parsed && typeof parsed === "object" && Array.isArray((parsed as { results?: unknown }).results)
    ? (parsed as { results: unknown[] }).results
    : null;
  if (!results || results.length !== reviews.length || !results.every((item) => isReviewAnalysis(item, expectedIds))) {
    throw new Error("OpenAI returned an invalid analysis response.");
  }
  if (new Set(results.map((item) => (item as ReviewAnalysis).id)).size !== reviews.length) {
    throw new Error("OpenAI returned duplicate or missing review IDs.");
  }
  return results as ReviewAnalysis[];
}

function readIds(body: unknown) {
  if (!body || typeof body !== "object" || !Array.isArray((body as { ids?: unknown }).ids)) return null;
  const ids = (body as { ids: unknown[] }).ids;
  if (!ids.length || ids.length > MAX_REVIEWS_PER_REQUEST || !ids.every((id) => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id))) return null;
  const unique = [...new Set(ids as string[])];
  return unique.length === ids.length ? unique : null;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = requests.get(key);
  if (!current || current.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Review analysis failed unexpectedly.";
}

