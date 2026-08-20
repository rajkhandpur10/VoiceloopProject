"use client";

import { useEffect } from "react";
import type { Review } from "../lib/data";
import { CloseIcon, SparkleIcon } from "./icons";

export function MetricCard({ label, value, meta }: { label: string; value: string; meta: string }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[13px] font-bold text-slate-500">{label}</p><p className={`mt-2 font-extrabold tracking-tight text-slate-950 ${value.length > 8 ? "text-[22px]" : "text-3xl"}`}>{value}</p><p className="mt-2 text-[13px] text-slate-500">{meta}</p></article>;
}

export function SectionHeading({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-[28px]">{title}</h2><p className="mt-1.5 text-slate-600">{description}</p></div>{action}</div>;
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return <div className="mb-5 flex items-start justify-between gap-4"><div><h3 className="font-bold text-slate-950">{title}</h3>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>{action}</div>;
}

export function Badge({ sentiment }: { sentiment: Review["sentiment"] | "neutral" | null }) {
  if (!sentiment) return <span className="inline-flex whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">Not analyzed yet</span>;
  const styles = sentiment === "positive" ? "bg-emerald-100 text-emerald-700" : sentiment === "negative" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${styles}`}>{sentiment}</span>;
}

export function InsightCard({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <article className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm"><div className="flex items-start gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-[10px] border border-indigo-200 bg-white text-indigo-600"><SparkleIcon className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{eyebrow}</p><h3 className="mt-1 text-lg font-bold text-slate-950">{title}</h3><div className="mt-2 text-sm leading-6 text-slate-700">{children}</div></div></div></article>;
}

export function EvidenceDrawer({ theme, reviews, onClose }: { theme: string | null; reviews: Review[]; onClose: () => void }) {
  useEffect(() => {
    if (!theme) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [theme, onClose]);

  if (!theme) return null;
  const evidence = reviews.filter((review) => review.theme === theme);
  return <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="drawer-title"><button aria-label="Close evidence drawer" onClick={onClose} className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"/><aside className="absolute inset-y-0 right-0 w-full max-w-lg overflow-y-auto bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Theme evidence</p><h2 id="drawer-title" className="mt-1 text-2xl font-extrabold tracking-tight">{theme}</h2><p className="mt-1 text-sm text-slate-500">{evidence.length} sample reviews supporting this theme</p></div><button onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Close"><CloseIcon className="size-5"/></button></div><div className="mt-5 grid gap-4">{evidence.length ? evidence.map((review) => <article key={review.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><Badge sentiment={review.sentiment}/><span className="text-xs font-semibold text-amber-600">{"★".repeat(review.rating)}<span className="text-slate-300">{"★".repeat(5-review.rating)}</span></span></div><p className="mt-3 text-sm leading-6 text-slate-700">“{review.text}”</p><p className="mt-3 text-xs text-slate-400">{review.source} · {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${review.date}T12:00:00`))}</p></article>) : <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No sample evidence available.</p>}</div></aside></div>;
}
