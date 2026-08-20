"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { AlertIcon, SearchIcon } from "./icons";
import { Badge, SectionHeading } from "./ui";

type DatabaseReview = {
  id: string;
  review_text: string;
  rating: number | null;
  review_date: string | null;
  source: string | null;
  reviewer_name: string | null;
  sentiment: "positive" | "negative" | "neutral" | null;
  theme: string | null;
  created_at: string;
};

const PAGE_SIZE = 5;

export default function ReviewExplorer({ onTheme }: { onTheme: (theme: string) => void }) {
  const [reviews, setReviews] = useState<DatabaseReview[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void getSupabaseClient().from("reviews").select("source").not("source", "is", null).limit(1_000).then(({ data }) => {
      if (!active) return;
      const unique = [...new Set((data ?? []).map((item) => item.source).filter((value): value is string => Boolean(value)))].sort();
      setSources(unique);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      const supabase = getSupabaseClient();
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let query = supabase.from("reviews").select("*", { count: "exact" });

      if (search.trim()) {
        const escaped = search.trim().replace(/[\\%_]/g, "\\$&");
        query = query.ilike("review_text", `%${escaped}%`);
      }
      if (source !== "all") query = query.eq("source", source);
      if (dateFrom) query = query.gte("review_date", dateFrom);
      if (dateTo) query = query.lte("review_date", dateTo);

      const { data, count, error: queryError } = await query
        .order("review_date", { ascending: sort === "oldest", nullsFirst: false })
        .order("created_at", { ascending: sort === "oldest" })
        .range(from, to);

      if (!active) return;
      if (queryError) {
        setError(queryError.message);
        setReviews([]);
        setTotal(0);
      } else {
        setReviews((data ?? []) as DatabaseReview[]);
        setTotal(count ?? 0);
      }
      setLoading(false);
    }, 250);

    return () => { active = false; window.clearTimeout(timer); };
  }, [search, source, dateFrom, dateTo, sort, page]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtersActive = Boolean(search || source !== "all" || dateFrom || dateTo);
  const sourceOptions = useMemo(() => [["all", "All sources"], ...sources.map((item) => [item, item])], [sources]);
  const update = (setter: (value: string) => void, value: string) => { setter(value); setPage(1); };
  const clearFilters = () => { setSearch(""); setSource("all"); setDateFrom(""); setDateTo(""); setPage(1); };

  return <section>
    <SectionHeading title="Review Explorer" description="Search and inspect reviews stored in Supabase."/>
    <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[1.35fr_.8fr_.8fr_.8fr_.8fr]">
      <label className="grid gap-2 md:col-span-2 xl:col-span-1"><span className="text-xs font-bold text-slate-600">Search reviews</span><span className="relative"><SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(event) => update(setSearch, event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Search review text"/></span></label>
      <Filter label="Source" value={source} onChange={(value) => update(setSource, value)} options={sourceOptions}/>
      <DateFilter label="From date" value={dateFrom} onChange={(value) => update(setDateFrom, value)}/>
      <DateFilter label="To date" value={dateTo} onChange={(value) => update(setDateTo, value)}/>
      <Filter label="Sort" value={sort} onChange={(value) => { setSort(value as "newest" | "oldest"); setPage(1); }} options={[["newest", "Newest first"], ["oldest", "Oldest first"]]}/>
    </div>

    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 p-5 sm:p-6"><div><h3 className="font-bold">Reviews</h3><p data-testid="review-count" className="mt-1 text-sm text-slate-500">{loading ? "Loading reviews…" : `${total} review${total === 1 ? "" : "s"}`}</p></div>{filtersActive && <button onClick={clearFilters} className="text-sm font-bold text-indigo-700 hover:underline">Clear filters</button>}</div>

      {error ? <div className="border-t border-slate-200 px-5 py-12 text-center"><AlertIcon className="mx-auto size-9 text-red-500"/><h3 className="mt-3 font-bold">Reviews couldn’t be loaded</h3><p className="mt-1 text-sm text-slate-500">{error}</p></div>
      : loading ? <div className="border-t border-slate-200 px-5 py-12 text-center"><span className="mx-auto block size-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"/><p className="mt-3 text-sm text-slate-500">Loading reviews from Supabase…</p></div>
      : reviews.length ? <><div className="hidden overflow-x-auto md:block"><table className="w-full border-collapse text-left"><thead><tr className="bg-slate-50 text-xs font-extrabold text-slate-600"><th className="px-5 py-3">Review</th><th className="px-3 py-3">Source</th><th className="px-3 py-3">Theme</th><th className="px-3 py-3">Sentiment</th><th className="px-3 py-3">Rating</th><th className="px-5 py-3">Date</th></tr></thead><tbody>{reviews.map((review) => <ReviewRow key={review.id} review={review} onTheme={onTheme}/>)}</tbody></table></div><div className="grid gap-3 px-4 pb-4 md:hidden">{reviews.map((review) => <ReviewCard key={review.id} review={review} onTheme={onTheme}/>)}</div><Pagination page={page} pages={pages} onPage={setPage}/></>
      : <div className="border-t border-slate-200 px-5 py-12 text-center"><SearchIcon className="mx-auto size-9 text-slate-300"/><h3 className="mt-3 font-bold">No reviews found</h3><p className="mt-1 text-sm text-slate-500">{filtersActive ? "Clear or adjust the current filters." : "Upload a CSV to add your first reviews."}</p></div>}
    </section>
  </section>;
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return <label className="grid gap-2"><span className="text-xs font-bold text-slate-600">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function DateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2"><span className="text-xs font-bold text-slate-600">{label}</span><input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/></label>;
}

function ReviewRow({ review, onTheme }: { review: DatabaseReview; onTheme: (theme: string) => void }) {
  return <tr className="border-t border-slate-200 text-sm hover:bg-slate-50"><td className="max-w-md px-5 py-4 leading-6 text-slate-700"><span>{review.review_text}</span>{review.reviewer_name && <span className="mt-1 block text-xs text-slate-400">— {review.reviewer_name}</span>}</td><td className="px-3 py-4 text-slate-600">{review.source ?? "Not provided"}</td><td className="px-3 py-4">{review.theme ? <button onClick={() => onTheme(review.theme!)} className="font-semibold text-indigo-700 hover:underline">{review.theme}</button> : <span className="text-slate-400">Not analyzed yet</span>}</td><td className="px-3 py-4"><Badge sentiment={review.sentiment}/></td><td className="whitespace-nowrap px-3 py-4 font-semibold text-amber-600">{review.rating ? `${review.rating}/5` : "—"}</td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{formatDate(review.review_date)}</td></tr>;
}

function ReviewCard({ review, onTheme }: { review: DatabaseReview; onTheme: (theme: string) => void }) {
  return <article className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><Badge sentiment={review.sentiment}/><span className="text-sm font-bold text-amber-600">{review.rating ? `${review.rating}/5` : "No rating"}</span></div><p className="mt-3 text-sm leading-6 text-slate-700">{review.review_text}</p><dl className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><dt className="text-slate-400">Source</dt><dd className="font-semibold text-slate-600">{review.source ?? "Not provided"}</dd></div><div><dt className="text-slate-400">Date</dt><dd className="font-semibold text-slate-600">{formatDate(review.review_date)}</dd></div><div className="col-span-2"><dt className="text-slate-400">Theme</dt><dd>{review.theme ? <button onClick={() => onTheme(review.theme!)} className="font-bold text-indigo-700">{review.theme}</button> : <span className="font-semibold text-slate-400">Not analyzed yet</span>}</dd></div></dl></article>;
}

function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
  return <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4"><p className="text-sm text-slate-500">Page {page} of {pages}</p><div className="flex gap-2"><button disabled={page === 1} onClick={() => onPage(page - 1)} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold disabled:opacity-40">Previous</button><button disabled={page === pages} onClick={() => onPage(page + 1)} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold disabled:opacity-40">Next</button></div></div>;
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`)) : "Not provided";
}
