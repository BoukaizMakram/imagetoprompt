"use client";

import { useState } from "react";

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

  return (
    <div>
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
        <div className="mt-4 rounded-2xl bg-ink text-paper p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="text-xs text-paper/50 uppercase tracking-wide">
              {selected.mode} · {selected.created_at.slice(0, 10)}
            </div>
            <button
              onClick={copy}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-accent-lime text-ink hover:opacity-90"
            >
              {copied ? "Copied ✓" : "Copy prompt"}
            </button>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-paper/90">
            {selected.prompt}
          </p>
        </div>
      )}
    </div>
  );
}
