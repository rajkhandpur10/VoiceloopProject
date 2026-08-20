"use client";

import { useCallback, useState } from "react";
import { reviews } from "../lib/data";
import { CloseIcon, GridIcon, MenuIcon, SearchIcon, SparkleIcon, UploadIcon } from "./icons";
import ReviewExplorer from "./review-explorer";
import { DashboardScreen, DigestScreen } from "./screens";
import UploadScreen from "./upload-screen";
import { EvidenceDrawer } from "./ui";

type View = "dashboard" | "upload" | "explorer" | "digest";

const viewMeta: Record<View, { title: string; eyebrow: string }> = {
  dashboard: { title: "Dashboard", eyebrow: "Restaurant feedback intelligence" },
  upload: { title: "CSV Upload", eyebrow: "Analyze customer reviews" },
  explorer: { title: "Review Explorer", eyebrow: "Inspect analyzed feedback" },
  digest: { title: "AI Digest", eyebrow: "Concise feedback summary" },
};

const navItems = [
  { id: "dashboard" as const, label: "Dashboard", icon: GridIcon },
  { id: "upload" as const, label: "CSV Upload", icon: UploadIcon },
  { id: "explorer" as const, label: "Review Explorer", icon: SearchIcon },
  { id: "digest" as const, label: "AI Digest", icon: SparkleIcon },
];

export default function VoiceLoopApp() {
  const [view, setView] = useState<View>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [evidenceTheme, setEvidenceTheme] = useState<string | null>(null);

  const navigate = (next: View) => {
    setView(next); setMobileOpen(false); window.location.hash = next;
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => document.getElementById("main-content")?.focus({ preventScroll: true }), 0);
  };
  const closeDrawer = useCallback(() => setEvidenceTheme(null), []);

  return <>
    <a href="#main-content" className="fixed left-4 top-3 z-[100] -translate-y-24 rounded-lg bg-slate-950 px-4 py-2 text-white focus:translate-y-0">Skip to content</a>
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className={`fixed inset-y-0 left-0 z-[60] flex w-[244px] flex-col border-r border-slate-200 bg-white p-4 shadow-xl transition-transform duration-200 md:translate-x-0 md:shadow-none ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`} aria-label="Primary navigation">
        <div className="flex items-center justify-between px-3 py-2"><button onClick={() => navigate("dashboard")} className="text-xl font-extrabold tracking-tight text-indigo-700" aria-label="VoiceLoop home">VoiceLoop</button><button onClick={() => setMobileOpen(false)} className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 md:hidden" aria-label="Close navigation"><CloseIcon className="size-5"/></button></div>
        <nav className="mt-5 grid gap-2">{navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => navigate(id)} aria-current={view === id ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-left font-semibold transition ${view === id ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}><Icon className="size-5"/><span>{label}</span></button>)}</nav>
        <div className="mt-auto rounded-xl bg-slate-50 p-3"><div className="flex items-center gap-2 text-xs font-bold text-slate-600"><span className="size-2 rounded-full bg-emerald-500"/> Sample data active</div><p className="mt-1 text-xs text-slate-400">Restaurant reviews · Aug 2026</p></div>
      </aside>
      {mobileOpen && <button className="fixed inset-0 z-50 bg-slate-950/40 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay"/>}
      <div className="min-w-0 md:ml-[244px]">
        <header className="sticky top-0 z-40 flex min-h-[76px] items-center gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6"><button onClick={() => setMobileOpen(true)} className="grid size-11 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 md:hidden" aria-label="Open navigation" aria-expanded={mobileOpen}><MenuIcon className="size-5"/></button><div><p className="hidden text-xs font-bold uppercase tracking-wider text-slate-500 sm:block">{viewMeta[view].eyebrow}</p><h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{viewMeta[view].title}</h1></div>{view !== "upload" && <button onClick={() => navigate("upload")} className="ml-auto hidden min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:inline-flex"><UploadIcon className="mr-2 size-4"/>Analyze new CSV</button>}</header>
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1168px] px-4 py-6 outline-none sm:px-6 sm:py-8">
          {view === "dashboard" && <DashboardScreen onTheme={setEvidenceTheme} onUpload={() => navigate("upload")}/>} 
          {view === "upload" && <UploadScreen onComplete={() => navigate("explorer")}/>} 
          {view === "explorer" && <ReviewExplorer onTheme={setEvidenceTheme}/>} 
          {view === "digest" && <DigestScreen onTheme={setEvidenceTheme}/>} 
        </main>
      </div>
    </div>
    <EvidenceDrawer theme={evidenceTheme} reviews={reviews} onClose={closeDrawer}/>
  </>;
}
