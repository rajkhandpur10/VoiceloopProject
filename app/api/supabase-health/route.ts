import { getSupabaseClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("reviews")
      .select("id")
      .limit(1);

    if (error) {
      return Response.json(
        { connected: false, message: "Supabase returned an unexpected response." },
        { status: 503 },
      );
    }

    return Response.json({
      connected: true,
      message: "Supabase API and reviews table reached successfully.",
    });
  } catch {
    return Response.json(
      { connected: false, message: "Could not reach Supabase." },
      { status: 503 },
    );
  }
}
