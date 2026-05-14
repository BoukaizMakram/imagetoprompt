"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compressImage";

type Mode =
  | "general"
  | "structured"
  | "graphic-design"
  | "json"
  | "flux"
  | "midjourney"
  | "stable-diffusion";

const MODE_GROUPS: { label: string; items: { id: Mode; label: string }[] }[] = [
  {
    label: "General",
    items: [
      { id: "general", label: "General Image Prompt" },
      { id: "structured", label: "Structured Prompt" },
    ],
  },
  {
    label: "Specialty",
    items: [
      { id: "graphic-design", label: "Graphic Design" },
      { id: "json", label: "JSON" },
    ],
  },
  {
    label: "Image generators",
    items: [
      { id: "flux", label: "Flux" },
      { id: "midjourney", label: "Midjourney" },
      { id: "stable-diffusion", label: "Stable Diffusion" },
    ],
  },
];

type ItemStatus = "pending" | "uploading" | "generating" | "done" | "error";

type QueueItem = {
  id: string;
  file: File;
  previewUrl: string;
  status: ItemStatus;
  prompt?: string;
  error?: string;
};

const MAX_FILES = 50;

export function BulkUploader({
  creditsRemaining,
  unlimited,
  onCreditsChanged,
  initialFiles,
  onBackToSingle,
}: {
  creditsRemaining: number | null;
  unlimited: boolean;
  onCreditsChanged: (next: number) => void;
  initialFiles?: File[] | null;
  onBackToSingle?: () => void;
}) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("general");
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs on unmount.
  useEffect(() => {
    return () => {
      items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback((files: FileList | File[] | null | undefined) => {
    if (!files) return;
    const arr = Array.from(files);
    const accepted: QueueItem[] = [];
    for (const f of arr) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > 30 * 1024 * 1024) continue;
      accepted.push({
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        status: "pending",
      });
    }
    if (!accepted.length) return;
    setItems((prev) => [...prev, ...accepted].slice(0, MAX_FILES));
    setSelectedId((curr) => curr ?? accepted[0].id);
  }, []);

  // Seed from parent (multi-drop on the single-image studio) — tracked by
  // reference identity so the same array is only consumed once.
  const seededRef = useRef<File[] | null>(null);
  useEffect(() => {
    if (initialFiles && initialFiles.length && seededRef.current !== initialFiles) {
      seededRef.current = initialFiles;
      addFiles(initialFiles);
    }
  }, [initialFiles, addFiles]);

  const patchItem = (id: string, patch: Partial<QueueItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((i) => i.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
  };

  const runQueue = async () => {
    const pending = items.filter((i) => i.status === "pending" || i.status === "error");
    if (!pending.length) return;
    setRunning(true);
    setGlobalError(null);

    const available = unlimited ? Infinity : (creditsRemaining ?? 0);
    if (!unlimited && available < pending.length) {
      setGlobalError(
        `You only have ${available} credit${available === 1 ? "" : "s"} — ${available} image${available === 1 ? "" : "s"} will be processed. Buy more credits to run the full batch.`
      );
    }
    const supabase = createSupabaseBrowserClient();

    for (const item of pending) {
      setSelectedId(item.id);
      try {
        patchItem(item.id, { status: "uploading", error: undefined, prompt: undefined });

        const compressed = await compressImage(item.file, 1280, 0.85);

        const urlRes = await fetch("/api/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ext: "jpg" }),
        });
        const urlData = await urlRes.json();
        if (!urlRes.ok || !urlData?.path || !urlData?.token) {
          throw new Error(urlData?.error || "Could not start upload.");
        }

        const { error: upErr } = await supabase.storage
          .from("prompt-images")
          .uploadToSignedUrl(urlData.path, urlData.token, compressed, {
            contentType: "image/jpeg",
            upsert: false,
          });
        if (upErr) throw new Error(upErr.message || "Upload failed.");

        patchItem(item.id, { status: "generating" });

        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imagePath: urlData.path, mode }),
        });
        const data = await res.json();
        if (res.status === 402 || data?.code === "out_of_credits") {
          patchItem(item.id, { status: "error", error: "Out of credits." });
          setGlobalError("You've run out of credits. Buy more to continue the queue.");
          break;
        }
        if (!res.ok || !data?.prompt) {
          throw new Error(data?.error || "Generation failed.");
        }

        patchItem(item.id, { status: "done", prompt: data.prompt as string });
        if (typeof data.creditsRemaining === "number") {
          onCreditsChanged(data.creditsRemaining);
        }
      } catch (e: any) {
        patchItem(item.id, { status: "error", error: e?.message || "Failed." });
      }
    }

    setRunning(false);
  };

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId]
  );

  const copy = async () => {
    if (!selected?.prompt) return;
    await navigator.clipboard.writeText(selected.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const pendingCount = items.filter(
    (i) => i.status === "pending" || i.status === "error"
  ).length;
  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* LEFT — Queue & controls */}
      <div className="bg-white rounded-3xl border border-black/5 shadow-[0_1px_0_rgba(0,0,0,0.03),0_20px_40px_-20px_rgba(0,0,0,0.08)] p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="text-sm font-semibold text-ink/80">
            1. Bulk queue {items.length > 0 ? `· ${doneCount}/${items.length}` : ""}
          </h2>
          {onBackToSingle && (
            <button
              onClick={onBackToSingle}
              disabled={running}
              className="text-xs text-ink/55 hover:text-ink underline-offset-2 hover:underline disabled:opacity-40"
            >
              ← Single image
            </button>
          )}
        </div>

        {/* Compact drop zone */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={`relative block rounded-2xl border-2 border-dashed transition-all cursor-pointer p-4 text-center
            ${dragging ? "border-ink bg-accent-lilac/30" : "border-black/10 hover:border-ink/30 bg-paper"}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files);
              if (inputRef.current) inputRef.current.value = "";
            }}
          />
          <div className="flex items-center justify-center gap-3 text-sm">
            <div className="w-9 h-9 rounded-xl bg-ink text-paper flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-semibold text-ink">Drop more images</div>
              <div className="text-xs text-ink/55">
                or <span className="underline">browse</span> · up to {MAX_FILES} · 30 MB each
              </div>
            </div>
          </div>
        </label>

        {/* Thumbnail grid */}
        {items.length > 0 && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => setSelectedId(it.id)}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition
                  ${selectedId === it.id ? "border-ink" : "border-transparent hover:border-ink/20"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.previewUrl} alt="" className="w-full h-full object-cover" />
                <span className="absolute top-1 right-1">
                  <StatusDot status={it.status} />
                </span>
                {!running && (it.status === "pending" || it.status === "error") && (
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(it.id);
                    }}
                    className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center hover:bg-black"
                    aria-label="Remove image"
                  >
                    ×
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Mode picker */}
        <div className="mt-5">
          <label className="text-xs font-semibold text-ink/60 mb-2 block" htmlFor="bulk-mode">
            Prompt style for the whole batch
          </label>
          <div className="relative">
            <select
              id="bulk-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              disabled={running}
              className="w-full appearance-none px-4 py-3 pr-10 rounded-2xl bg-paper border border-black/10 text-[15px] font-medium text-ink focus:border-ink focus:outline-none cursor-pointer disabled:opacity-60"
            >
              {MODE_GROUPS.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.items.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <svg
              className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Generate */}
        <button
          onClick={runQueue}
          disabled={running || pendingCount === 0}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-ink text-paper font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition"
        >
          {running ? (
            <>
              <Spinner /> Working… ({doneCount}/{items.length})
            </>
          ) : pendingCount === 0 ? (
            <>All done</>
          ) : (
            <>
              Generate {pendingCount} prompt{pendingCount === 1 ? "" : "s"}
              {!unlimited ? ` · ${pendingCount} credit${pendingCount === 1 ? "" : "s"}` : ""}
            </>
          )}
        </button>

        {globalError && <p className="mt-3 text-sm text-red-600">{globalError}</p>}
      </div>

      {/* RIGHT — Prompt for selected */}
      <div className="bg-ink text-paper rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-[0_20px_40px_-20px_rgba(0,0,0,0.4)] min-h-[420px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-paper/70">
            2. Prompt {selected ? `for ${selected.file.name}` : ""}
          </h2>
          {selected?.status === "done" && selected.prompt && (
            <button
              onClick={copy}
              className="text-xs text-paper/70 hover:text-paper inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 hover:border-white/30"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
        </div>

        {!selected && (
          <div className="text-paper/55 text-sm">
            Drop images on the left, then pick one to see its prompt.
          </div>
        )}

        {selected && selected.status === "pending" && (
          <div className="text-paper/55 text-sm">
            Queued — press <strong className="text-paper">Generate</strong> to run the batch.
          </div>
        )}

        {selected && (selected.status === "uploading" || selected.status === "generating") && (
          <div className="space-y-3">
            <div className="h-3 rounded shimmer w-3/4 opacity-20" />
            <div className="h-3 rounded shimmer w-full opacity-20" />
            <div className="h-3 rounded shimmer w-5/6 opacity-20" />
            <div className="h-3 rounded shimmer w-2/3 opacity-20" />
            <p className="mt-7 text-base sm:text-lg font-semibold tracking-tight text-sweep">
              {selected.status === "uploading" ? "Uploading…" : "Analyzing your image…"}
            </p>
          </div>
        )}

        {selected && selected.status === "error" && (
          <div className="text-red-300 text-sm">
            {selected.error || "Something went wrong."}
            <div className="mt-3">
              <Link
                href="/pricing"
                className="inline-flex items-center px-4 py-2 rounded-full bg-accent-lime text-ink text-xs font-semibold hover:opacity-90"
              >
                Buy a credit pack →
              </Link>
            </div>
          </div>
        )}

        {selected && selected.status === "done" && selected.prompt && (
          <div>
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {selected.prompt}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={copy}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-accent-lime text-ink text-sm font-semibold hover:opacity-90"
              >
                {copied ? "Copied ✓" : "Copy prompt"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: ItemStatus }) {
  const color: Record<ItemStatus, string> = {
    pending: "bg-white/70 border-black/20",
    uploading: "bg-accent-sky border-black/20",
    generating: "bg-accent-lilac border-black/20 animate-pulse",
    done: "bg-accent-lime border-black/20",
    error: "bg-red-500 border-white/40",
  };
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full border ${color[status]}`}
      aria-label={status}
    />
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
