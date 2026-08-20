"use client";

import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { parseReviewCsv, type ReviewInsert } from "@/lib/csv/reviews";
import { getSupabaseClient } from "@/lib/supabase/client";
import { AlertIcon, CheckIcon, UploadIcon } from "./icons";
import { SectionHeading } from "./ui";

type UploadStatus = "idle" | "ready" | "uploading" | "analyzing" | "success" | "error";

export default function UploadScreen({ onComplete }: { onComplete: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ReviewInsert[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);

  const reset = () => {
    setStatus("idle");
    setFileName("");
    setRows([]);
    setWarnings([]);
    setMessage("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setRows([]);
    setWarnings([]);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setStatus("error");
      setMessage("VoiceLoop currently accepts CSV files only.");
      return;
    }

    try {
      const validation = parseReviewCsv(await file.text());
      if (validation.fatalError) {
        setStatus("error");
        setMessage(validation.fatalError);
        setWarnings(validation.errors);
        return;
      }
      setRows(validation.rows);
      setWarnings(validation.errors);
      setStatus("ready");
    } catch {
      setStatus("error");
      setMessage("We couldn’t read that file. Choose another CSV and try again.");
    }
  };

  const upload = async () => {
    if (!rows.length) return;
    setStatus("uploading");
    setMessage("");
    let reviewsUploaded = false;

    try {
      const supabase = getSupabaseClient();
      const insertedIds: string[] = [];
      for (let index = 0; index < rows.length; index += 500) {
        const { data, error } = await supabase.from("reviews").insert(rows.slice(index, index + 500)).select("id");
        if (error) throw error;
        insertedIds.push(...(data ?? []).map((review) => review.id));
      }

      reviewsUploaded = true;
      setStatus("analyzing");
      for (let index = 0; index < insertedIds.length; index += 50) {
        const response = await fetch("/api/reviews/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: insertedIds.slice(index, index + 50) }),
        });
        const result = await response.json() as { error?: string; failed?: number; failures?: Array<{ message: string }> };
        if (!response.ok || result.failed) {
          throw new Error(result.error ?? result.failures?.[0]?.message ?? "Some reviews could not be analyzed.");
        }
      }
      setStatus("success");
    } catch (error) {
      setStatus("error");
      const detail = error instanceof Error ? error.message : "The request failed unexpectedly.";
      setMessage(reviewsUploaded
        ? `Your reviews were uploaded safely, but AI analysis did not finish. ${detail}`
        : `The reviews could not be uploaded. ${detail}`);
    }
  };

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void handleFile(event.dataTransfer.files[0]);
  };

  return <section className="mx-auto max-w-3xl" aria-labelledby="upload-heading">
    <SectionHeading title="Upload customer reviews" description="Upload one CSV with a non-empty review_text column."/>
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={drop} className={`flex min-h-60 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-slate-50"}`}>
        <span className="grid size-14 place-items-center rounded-xl bg-indigo-100 text-indigo-700"><UploadIcon className="size-7"/></span>
        <h3 className="mt-3 font-bold text-slate-950">Upload review CSV</h3>
        <p className="mt-2 text-sm text-slate-600">Required: <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs">review_text</code><br/>Optional: rating, review_date, source, reviewer_name</p>
        <label className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-indigo-600 px-5 font-bold text-white hover:bg-indigo-700">Choose CSV file<input ref={inputRef} className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => void handleFile(event.target.files?.[0])}/></label>
      </div>

      {status === "ready" && <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800"><div className="flex items-start gap-3"><CheckIcon className="mt-0.5 size-5 shrink-0"/><div><strong className="block">{fileName}</strong><span className="text-sm">{rows.length} valid review{rows.length === 1 ? "" : "s"} ready to upload.</span></div></div>{warnings.length > 0 && <p className="mt-3 border-t border-emerald-200 pt-3 text-sm">{warnings.length} invalid row{warnings.length === 1 ? " was" : "s were"} skipped. {warnings.slice(0, 2).join(" ")}</p>}</div>}
      {status === "error" && <StatePanel kind="error" title={fileName || "Upload error"} message={message}/>} 
      {status === "uploading" && <StatePanel kind="loading" title="Uploading reviews" message={`Saving ${rows.length} valid review${rows.length === 1 ? "" : "s"} to VoiceLoop…`}/>} 
      {status === "analyzing" && <StatePanel kind="loading" title="Analyzing customer feedback…" message="VoiceLoop is identifying restaurant themes and sentiment. Your uploaded reviews are already safe."/>} 
      {status === "success" && <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-6 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-600 text-white"><CheckIcon className="size-6"/></span><h3 className="mt-3 text-lg font-bold text-emerald-900">Upload complete</h3><p className="mt-1 text-sm text-emerald-800">{rows.length} review{rows.length === 1 ? "" : "s"} saved to Supabase.</p><button onClick={onComplete} className="mt-4 min-h-11 rounded-lg bg-indigo-600 px-5 font-bold text-white hover:bg-indigo-700">View reviews</button></div>}

      <div className="mt-4 grid justify-items-center gap-2"><button onClick={() => void upload()} disabled={status !== "ready"} className="min-h-11 w-full rounded-lg bg-indigo-600 px-5 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">{status === "ready" ? `Upload ${rows.length} Review${rows.length === 1 ? "" : "s"}` : "Upload reviews"}</button>{status !== "idle" && status !== "uploading" && status !== "analyzing" && <button onClick={reset} className="min-h-10 px-3 text-sm font-bold text-indigo-700 hover:underline">Change file</button>}</div>
    </div>
  </section>;
}

function StatePanel({ kind, title, message }: { kind: "loading" | "error"; title: string; message: string }) {
  return <div role="status" className={`mt-4 rounded-xl border p-6 text-center ${kind === "error" ? "border-red-200 bg-red-50 text-red-900" : "border-slate-200 bg-white"}`}>{kind === "loading" ? <span className="mx-auto block size-12 animate-spin rounded-full border-[5px] border-slate-200 border-t-indigo-600"/> : <AlertIcon className="mx-auto size-10 text-red-600"/>}<h3 className="mt-3 font-bold">{title}</h3><p className="mt-1 text-sm opacity-80">{message}</p></div>;
}
