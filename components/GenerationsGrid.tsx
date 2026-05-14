"use client";

import { useState } from "react";
import Link from "next/link";

type Generation = {
  id: string;
  url: string | null;
  prompt: string;
  mode: string;
  created_at: string;
};

export function GenerationsGrid({ items }: { items: Generation[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selected = items.find((g) => g.id === selectedId) ?? null;

  const copy = async () => {
    if (!selected) return;
    await navigator.clipboard.writeText(selected.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const useImageHref = selected?.url
    ? `/image-to-prompt?imageUrl=${encodeURIComponent(selected.url)}&mode=${encodeURIComponent(selected.mode)}`
    : null;
  const regenerateHref = useImageHref ? `${useImageHref}&autoGenerate=1` : null;

  return (
    <div className={selected ? "lg:grid lg:grid-cols-[1fr_340px] lg:gap-5 lg:items-start" : ""}>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((g) => (
          <li key={g.id}>
            <button
              onClick={() => setSelectedId(g.id === selectedId ? null : g.id)}
              className={`w-full text-left rounded-2xl border overflow-hidden flex flex-col transition
                ${g.id === selectedId
                  ? "border-ink ring-2 ring-ink"
                  : "border-black/5 bg-white hover:border-ink/30"
                }`}
            >
              {g.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={g.url}
                  alt=""
                  className="w-full aspect-square object-cover bg-paper"
                />
              ) : (
                <div className="w-full aspect-square bg-paper" />
              )}
              <div className="p-3 flex flex-col gap-1 bg-white">
                <div className="flex items-center justify-between gap-2 text-[11px] text-ink/50">
                  <span className="uppercase tracking-wide">{g.mode}</span>
                  <span>{g.created_at.slice(0, 10)}</span>
                </div>
                <p className="text-xs text-ink/75 line-clamp-2 leading-relaxed">{g.prompt}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <div className="mt-4 lg:mt-0 rounded-2xl bg-ink text-paper p-5 lg:sticky lg:top-5">
          {selected.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.url}
              alt=""
              className="w-full aspect-square object-cover rounded-xl mb-4 border border-white/10"
            />
          )}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="text-xs text-paper/50 uppercase tracking-wide">
              {selected.mode} · {selected.created_at.slice(0, 10)}
            </div>
            <button
              onClick={copy}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-accent-lime text-ink hover:opacity-90 shrink-0"
            >
              {copied ? "Copied ✓" : "Copy prompt"}
            </button>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-paper/90 mb-4">
            {selected.prompt}
          </p>
          <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
            {useImageHref ? (
              <>
                <Link
                  href={useImageHref}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-accent-lime text-ink text-sm font-semibold hover:opacity-90"
                >
                  Use this image again →
                </Link>
                <Link
                  href={regenerateHref!}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white/10 text-paper text-sm hover:bg-white/20 border border-white/10"
                >
                  Regenerate prompt
                </Link>
              </>
            ) : (
              <p className="text-xs text-paper/40">Image URL expired — re-upload to generate again.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
