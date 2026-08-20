"use client";

import { useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import { negativeThemes, positiveThemes, reviews, themes, type Review } from "../lib/data";
import { AlertIcon, CheckIcon, ChevronIcon, SearchIcon, SparkleIcon, UploadIcon } from "./icons";
import { Badge, CardHeader, InsightCard, MetricCard, SectionHeading } from "./ui";

type DashboardProps = { onTheme: (theme: string) => void; onUpload: () => void };

export function DashboardScreen({ onTheme, onUpload }: DashboardProps) {
  return <section aria-labelledby="dashboard-heading">
    <SectionHeading title="Customer feedback overview" description="147 reviews analyzed from the current CSV upload." action={<span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700"><CheckIcon className="size-3.5"/> Analysis complete</span>}/>
    <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><MetricCard label="Reviews analyzed" value="147" meta="Valid reviews in current upload"/><MetricCard label="Top complaint" value="Slow Service" meta="31 reviews"/><MetricCard label="Top positive theme" value="Food Quality" meta="42 reviews"/></div>
    <div className="mb-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><CardHeader title="Customers love" description="Most common positive themes"/><div className="grid gap-5">{positiveThemes.map((theme) => <button key={theme.name} onClick={() => onTheme(theme.name)} className="group text-left" aria-label={`View evidence for ${theme.name}`}><span className="mb-2 flex justify-between gap-3 text-sm font-semibold"><span className="group-hover:text-indigo-700">{theme.name}</span><strong className="text-slate-500">{theme.count}</strong></span><span className="block h-2.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all group-hover:from-indigo-700" style={{ width: `${theme.percent}%` }}/></span></button>)}</div><p className="mt-5 text-xs text-slate-400">Select a theme to view supporting reviews</p></section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><CardHeader title="Customer complaints" description="Recurring negative themes"/><div className="overflow-hidden rounded-lg border border-slate-200">{negativeThemes.map((theme, index) => <button key={theme.name} onClick={() => onTheme(theme.name)} className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-semibold hover:bg-red-50 ${index ? "border-t border-slate-200" : ""}`}><span>{theme.name}</span><span className="flex items-center gap-2 text-red-700"><strong>{theme.count}</strong><ChevronIcon className="size-4"/></span></button>)}</div><p className="mt-5 text-xs text-slate-400">Select a complaint to inspect evidence</p></section>
    </div>
    <InsightCard eyebrow="Most frequent complaint" title="Slow Service"><p>Mentioned in <strong>31 reviews</strong>. This is the most frequent complaint in the current upload.</p><button onClick={() => onTheme("Slow Service")} className="mt-3 font-bold text-indigo-700 hover:underline">View evidence →</button></InsightCard>
    <button onClick={onUpload} className="mt-6 text-sm font-bold text-indigo-700 hover:underline sm:hidden">Analyze a new CSV →</button>
  </section>;
}

type UploadStatus = "idle" | "ready" | "loading" | "success" | "error";

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return { error: "The uploaded file is empty.", count: 0 };
  const parseLine = (line: string) => {
    const values: string[] = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"' && quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === "," && !quoted) {
        values.push(value);
        value = "";
      } else {
        value += character;
      }
    }
    values.push(value);
    return values;
  };
  const headers = parseLine(lines[0]).map((header) => header.trim());
  const index = headers.indexOf("review_text");
  if (index < 0) return { error: "The “review_text” column is missing.", count: 0 };
  const count = lines.slice(1).filter((line) => parseLine(line)[index]?.trim()).length;
  return count ? { count, error: "" } : { error: "No valid reviews were found in the review_text column.", count: 0 };
}

export function UploadScreen({ onComplete }: { onComplete: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [fileName, setFileName] = useState("");
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);

  const handleFile = (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    if (!file.name.toLowerCase().endsWith(".csv")) { setStatus("error"); setMessage("VoiceLoop currently accepts CSV files only."); return; }
    const reader = new FileReader();
    reader.onload = () => { const result = parseCsv(String(reader.result ?? "")); setCount(result.count); setMessage(result.error); setStatus(result.error ? "error" : "ready"); };
    reader.onerror = () => { setStatus("error"); setMessage("We couldn’t read that file. Choose another CSV and try again."); };
    reader.readAsText(file);
  };
  const reset = () => { setStatus("idle"); setFileName(""); setCount(0); setMessage(""); if (inputRef.current) inputRef.current.value = ""; };
  const analyze = () => { setStatus("loading"); window.setTimeout(() => { if (fileName.toLowerCase().includes("analysis-error")) { setStatus("error"); setMessage("We couldn’t analyze your reviews. Please try again."); } else { setStatus("success"); } }, 1100); };
  const drop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); handleFile(event.dataTransfer.files[0]); };

  return <section className="mx-auto max-w-3xl" aria-labelledby="upload-heading"><SectionHeading title="Upload customer reviews" description="Upload one CSV with a non-empty review_text column."/>
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div onDragEnter={(e) => { e.preventDefault(); setDragging(true); }} onDragOver={(e) => e.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={drop} className={`flex min-h-60 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-slate-50"}`}><span className="grid size-14 place-items-center rounded-xl bg-indigo-100 text-indigo-700"><UploadIcon className="size-7"/></span><h3 className="mt-3 font-bold text-slate-950">Upload review CSV</h3><p className="mt-2 text-sm text-slate-600">Drag and drop here, or choose a file<br/><code className="mt-2 inline-block rounded bg-slate-200 px-1.5 py-0.5 text-xs">required: review_text</code></p><label className="mt-5 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-indigo-600 px-5 font-bold text-white hover:bg-indigo-700">Choose CSV file<input ref={inputRef} className="sr-only" type="file" accept=".csv,text/csv" onChange={(e) => handleFile(e.target.files?.[0])}/></label></div>
      {status === "ready" && <div className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800"><CheckIcon className="mt-0.5 size-5 shrink-0"/><div><strong className="block">{fileName}</strong><span className="text-sm">{count} valid review{count === 1 ? "" : "s"} ready to analyze.</span></div></div>}
      {status === "error" && <StatePanel kind="error" title={fileName || "Upload error"} message={message}/>} 
      {status === "loading" && <StatePanel kind="loading" title="Analyzing reviews" message="Finding recurring customer themes and common complaints…"/>}
      {status === "success" && <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-6 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-600 text-white"><CheckIcon className="size-6"/></span><h3 className="mt-3 text-lg font-bold text-emerald-900">Analysis complete</h3><p className="mt-1 text-sm text-emerald-800">Your sample dashboard is ready to explore.</p><button onClick={onComplete} className="mt-4 min-h-11 rounded-lg bg-indigo-600 px-5 font-bold text-white hover:bg-indigo-700">View insights</button></div>}
      <div className="mt-4 grid justify-items-center gap-2"><button onClick={analyze} disabled={status !== "ready"} className="min-h-11 w-full rounded-lg bg-indigo-600 px-5 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">{status === "ready" ? `Analyze ${count} Review${count === 1 ? "" : "s"}` : "Analyze reviews"}</button>{status !== "idle" && status !== "loading" && <button onClick={reset} className="min-h-10 px-3 text-sm font-bold text-indigo-700 hover:underline">Change file</button>}</div>
    </div></section>;
}

function StatePanel({ kind, title, message }: { kind: "loading" | "error"; title: string; message: string }) {
  return <div role="status" className={`mt-4 rounded-xl border p-6 text-center ${kind === "error" ? "border-red-200 bg-red-50 text-red-900" : "border-slate-200 bg-white"}`}>{kind === "loading" ? <span className="mx-auto block size-12 animate-spin rounded-full border-[5px] border-slate-200 border-t-indigo-600"/> : <AlertIcon className="mx-auto size-10 text-red-600"/>}<h3 className="mt-3 font-bold">{title}</h3><p className="mt-1 text-sm opacity-80">{message}</p></div>;
}

export function ReviewExplorer({ onTheme }: { onTheme: (theme: string) => void }) {
  const [search, setSearch] = useState(""); const [theme, setTheme] = useState("all"); const [sentiment, setSentiment] = useState("all"); const [sort, setSort] = useState("newest"); const [page, setPage] = useState(1); const pageSize = 5;
  const filtered = useMemo(() => reviews.filter((review) => (!search.trim() || `${review.text} ${review.theme} ${review.source}`.toLowerCase().includes(search.toLowerCase())) && (theme === "all" || review.theme === theme) && (sentiment === "all" || review.sentiment === sentiment)).sort((a,b) => sort === "oldest" ? a.date.localeCompare(b.date) : sort === "rating-high" ? b.rating-a.rating : sort === "rating-low" ? a.rating-b.rating : b.date.localeCompare(a.date)), [search, theme, sentiment, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize)); const safePage = Math.min(page, pages); const visible = filtered.slice((safePage-1)*pageSize, safePage*pageSize);
  const update = (setter: (value: string) => void, value: string) => { setter(value); setPage(1); };
  return <section><SectionHeading title="Review Explorer" description="Search and inspect the reviews included in the analyzed CSV."/>
    <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[1.5fr_repeat(3,.8fr)]"><label className="grid gap-2 md:col-span-2 xl:col-span-1"><span className="text-xs font-bold text-slate-600">Search reviews</span><span className="relative"><SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e) => update(setSearch,e.target.value)} className="min-h-11 w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Search text, theme, or source"/></span></label><Filter label="Theme" value={theme} onChange={(v) => update(setTheme,v)} options={[['all','All themes'], ...themes.map((x) => [x,x])]} /><Filter label="Sentiment" value={sentiment} onChange={(v) => update(setSentiment,v)} options={[["all","All sentiment"],["positive","Positive"],["negative","Negative"]]}/><Filter label="Sort" value={sort} onChange={(v) => update(setSort,v)} options={[["newest","Newest first"],["oldest","Oldest first"],["rating-high","Rating high to low"],["rating-low","Rating low to high"]]}/></div>
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between gap-4 p-5 sm:p-6"><div><h3 className="font-bold">Reviews</h3><p className="mt-1 text-sm text-slate-500">{filtered.length} review{filtered.length === 1 ? "" : "s"}</p></div>{(search || theme !== "all" || sentiment !== "all") && <button onClick={() => { setSearch(""); setTheme("all"); setSentiment("all"); setPage(1); }} className="text-sm font-bold text-indigo-700 hover:underline">Clear filters</button>}</div>
      {visible.length ? <><div className="hidden overflow-x-auto md:block"><table className="w-full border-collapse text-left"><thead><tr className="bg-slate-50 text-xs font-extrabold text-slate-600"><th className="px-5 py-3">Review</th><th className="px-3 py-3">Theme</th><th className="px-3 py-3">Sentiment</th><th className="px-3 py-3">Rating</th><th className="px-5 py-3">Date</th></tr></thead><tbody>{visible.map((review) => <ReviewRow key={review.id} review={review} onTheme={onTheme}/>)}</tbody></table></div><div className="grid gap-3 px-4 pb-4 md:hidden">{visible.map((review) => <ReviewCard key={review.id} review={review} onTheme={onTheme}/>)}</div><Pagination page={safePage} pages={pages} onPage={setPage}/></> : <div className="border-t border-slate-200 px-5 py-12 text-center"><SearchIcon className="mx-auto size-9 text-slate-300"/><h3 className="mt-3 font-bold">No reviews match these filters</h3><p className="mt-1 text-sm text-slate-500">Clear or adjust the current search and filters.</p></div>}
    </section></section>;
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <label className="grid gap-2"><span className="text-xs font-bold text-slate-600">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">{options.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>; }
function ReviewRow({ review, onTheme }: { review: Review; onTheme: (theme:string) => void }) { return <tr className="border-t border-slate-200 text-sm hover:bg-slate-50"><td className="max-w-md px-5 py-4 leading-6 text-slate-700">{review.text}</td><td className="px-3 py-4"><button onClick={() => onTheme(review.theme)} className="font-semibold text-indigo-700 hover:underline">{review.theme}</button></td><td className="px-3 py-4"><Badge sentiment={review.sentiment}/></td><td className="whitespace-nowrap px-3 py-4 font-semibold text-amber-600">{review.rating}/5</td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{formatDate(review.date)}</td></tr>; }
function ReviewCard({ review, onTheme }: { review: Review; onTheme:(theme:string)=>void }) { return <article className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><Badge sentiment={review.sentiment}/><span className="text-sm font-bold text-amber-600">{review.rating}/5</span></div><p className="mt-3 text-sm leading-6 text-slate-700">{review.text}</p><div className="mt-3 flex items-center justify-between gap-3 text-xs"><button onClick={() => onTheme(review.theme)} className="font-bold text-indigo-700">{review.theme}</button><span className="text-slate-400">{formatDate(review.date)}</span></div></article>; }
function Pagination({ page, pages, onPage }: { page:number; pages:number; onPage:(page:number)=>void }) { return <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4"><p className="text-sm text-slate-500">Page {page} of {pages}</p><div className="flex gap-2"><button disabled={page===1} onClick={() => onPage(page-1)} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold disabled:opacity-40">Previous</button><button disabled={page===pages} onClick={() => onPage(page+1)} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold disabled:opacity-40">Next</button></div></div>; }
function formatDate(value:string) { return new Intl.DateTimeFormat("en-US", { month:"short", day:"numeric", year:"numeric" }).format(new Date(`${value}T12:00:00`)); }

export function DigestScreen({ onTheme }: { onTheme:(theme:string)=>void }) {
  return <section><SectionHeading title="AI Digest" description="A concise summary of the same analyzed review set."/><div className="mb-5 grid gap-5 md:grid-cols-2"><article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Customers love</p><h3 className="mt-2 text-xl font-extrabold">Food Quality</h3><p className="mt-2 text-sm leading-6 text-slate-600">Food quality is the most common positive theme, appearing in 42 reviews.</p><button onClick={() => onTheme("Food Quality")} className="mt-4 text-sm font-bold text-indigo-700 hover:underline">Explore evidence →</button></article><article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-red-700">Customers dislike</p><h3 className="mt-2 text-xl font-extrabold">Slow Service</h3><p className="mt-2 text-sm leading-6 text-slate-600">Slow service is the most frequent complaint, appearing in 31 reviews.</p><button onClick={() => onTheme("Slow Service")} className="mt-4 text-sm font-bold text-indigo-700 hover:underline">Explore evidence →</button></article></div><InsightCard eyebrow="Pay attention to" title="Slow Service"><p>It is the highest-count negative theme in this upload. VoiceLoop is identifying frequency only—not root cause or business impact.</p></InsightCard><article className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><CardHeader title="Summary" description="Generated from the current sample analysis."/><p className="leading-7 text-slate-700">Customers consistently praise food quality, staff friendliness, and atmosphere. The most common recurring complaints concern slow service, long waits, and food temperature. Slow service appears most often in the review set.</p><div className="mt-6 flex items-start gap-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600"><SparkleIcon className="mt-0.5 size-5 shrink-0 text-indigo-600"/><p><strong className="text-slate-800">Prototype digest:</strong> This summary is static sample content. No AI service or external API is connected.</p></div></article></section>;
}
