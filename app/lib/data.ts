export type Sentiment = "positive" | "negative";

export type Review = {
  id: number;
  text: string;
  theme: string;
  sentiment: Sentiment;
  rating: number;
  date: string;
  source: string;
};

export const reviews: Review[] = [
  { id: 1, text: "The biryani was excellent and full of flavor. Best meal we have had here in months.", theme: "Food Quality", sentiment: "positive", rating: 5, date: "2026-08-17", source: "Google" },
  { id: 2, text: "Our server Maya was friendly and checked in often without hovering.", theme: "Friendly Staff", sentiment: "positive", rating: 5, date: "2026-08-16", source: "Yelp" },
  { id: 3, text: "Beautiful dining room and a relaxed atmosphere for our anniversary dinner.", theme: "Atmosphere", sentiment: "positive", rating: 4, date: "2026-08-14", source: "OpenTable" },
  { id: 4, text: "Food was good, but it took almost forty minutes to arrive after we ordered.", theme: "Slow Service", sentiment: "negative", rating: 3, date: "2026-08-13", source: "Google" },
  { id: 5, text: "We waited too long for a table even though we had a reservation.", theme: "Long Wait Times", sentiment: "negative", rating: 2, date: "2026-08-12", source: "Yelp" },
  { id: 6, text: "My curry was barely warm when it reached the table, though the flavor was nice.", theme: "Food Temperature", sentiment: "negative", rating: 2, date: "2026-08-10", source: "Google" },
  { id: 7, text: "The staff made our family feel welcome from the moment we arrived.", theme: "Friendly Staff", sentiment: "positive", rating: 5, date: "2026-08-08", source: "Tripadvisor" },
  { id: 8, text: "Dinner tasted great, but service slowed down significantly after we ordered.", theme: "Slow Service", sentiment: "negative", rating: 3, date: "2026-08-06", source: "OpenTable" },
  { id: 9, text: "Every dish felt fresh and carefully prepared. The paneer was a standout.", theme: "Food Quality", sentiment: "positive", rating: 5, date: "2026-08-04", source: "Google" },
  { id: 10, text: "The patio lighting and music made the whole evening feel special.", theme: "Atmosphere", sentiment: "positive", rating: 4, date: "2026-08-02", source: "Yelp" },
  { id: 11, text: "Drinks arrived quickly, but we waited nearly an hour for our entrees.", theme: "Slow Service", sentiment: "negative", rating: 2, date: "2026-07-30", source: "Google" },
  { id: 12, text: "The naan arrived cold and we had to ask twice for a replacement.", theme: "Food Temperature", sentiment: "negative", rating: 2, date: "2026-07-28", source: "Tripadvisor" },
  { id: 13, text: "Our host found us a quiet table and everyone was genuinely kind.", theme: "Friendly Staff", sentiment: "positive", rating: 5, date: "2026-07-26", source: "OpenTable" },
  { id: 14, text: "Rich sauces, tender chicken, and generous portions. We will be back.", theme: "Food Quality", sentiment: "positive", rating: 5, date: "2026-07-24", source: "Yelp" },
  { id: 15, text: "The reservation line moved slowly and several parties looked confused.", theme: "Long Wait Times", sentiment: "negative", rating: 2, date: "2026-07-22", source: "Google" },
];

export const positiveThemes = [
  { name: "Food Quality", count: 42, percent: 100 },
  { name: "Friendly Staff", count: 28, percent: 67 },
  { name: "Atmosphere", count: 18, percent: 43 },
];

export const negativeThemes = [
  { name: "Slow Service", count: 31 },
  { name: "Long Wait Times", count: 19 },
  { name: "Food Temperature", count: 12 },
];

export const themes = [...positiveThemes, ...negativeThemes].map((theme) => theme.name);
