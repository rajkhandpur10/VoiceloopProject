export const REVIEW_THEMES = [
  "Food Quality",
  "Service Speed",
  "Staff Friendliness",
  "Wait Time",
  "Atmosphere",
  "Cleanliness",
  "Value",
  "Parking",
  "Ordering / Delivery",
  "Other",
] as const;

export const SENTIMENTS = ["Positive", "Neutral", "Negative"] as const;

export type ReviewTheme = (typeof REVIEW_THEMES)[number];
export type ReviewSentiment = (typeof SENTIMENTS)[number];

export type ReviewAnalysis = {
  id: string;
  theme: ReviewTheme;
  sentiment: ReviewSentiment;
};

export function isReviewAnalysis(value: unknown, expectedIds: Set<string>): value is ReviewAnalysis {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === "string"
    && expectedIds.has(candidate.id)
    && REVIEW_THEMES.includes(candidate.theme as ReviewTheme)
    && SENTIMENTS.includes(candidate.sentiment as ReviewSentiment);
}

