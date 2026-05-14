"use client";

import { useState } from "react";

type Tier = "standard" | "enhanced" | "premium";

const TIERS: { id: Tier; label: string; credits: number; desc: string }[] = [
  {
    id: "standard",
    label: "Standard",
    credits: 1,
    desc: "Fast and efficient for most images.",
  },
  {
    id: "enhanced",
    label: "Enhanced",
    credits: 2,
    desc: "Better composition and lighting detail.",
  },
  {
    id: "premium",
    label: "Premium",
    credits: 3,
    desc: "Highest accuracy — best for complex, artistic, or detailed images.",
  },
];

export function ModelPreference({ initial }: { initial: Tier }) {
  const [selected, setSelected] = useState<Tier>(initial);
  const [pending, setPending] = useState<Tier | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (tier: Tier) => {
    if (tier === selected) return;
    setPending(tier);
    setSaved(false);
  };

  const confirm = async () => {
    if (!pending) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/account/model-preference", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: pending }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSelected(pending);
      setPending(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setPending(null);
    setError(null);
  };

  const activeTier = pending ?? selected;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TIERS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleChange(t.id)}
            className={`text-left rounded-2xl border p-4 transition-all ${
              activeTier === t.id
                ? "border-ink bg-ink text-paper"
                : "border-black/10 bg-white hover:border-ink/30"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm">{t.label}</span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  activeTier === t.id
                    ? "bg-white/15 text-paper/80"
                    : "bg-black/5 text-ink/60"
                }`}
              >
                {t.credits} credit{t.credits > 1 ? "s" : ""}
              </span>
            </div>
            <p className={`text-xs leading-snug ${activeTier === t.id ? "text-paper/70" : "text-ink/55"}`}>
              {t.desc}
            </p>
          </button>
        ))}
      </div>

      {pending && pending !== selected && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold mb-1">
            Switch to {TIERS.find((t) => t.id === pending)?.label}?
          </p>
          <p className="text-amber-800/80 mb-3">
            Every generation will cost{" "}
            <strong>{TIERS.find((t) => t.id === pending)?.credits} credits</strong> instead of{" "}
            {TIERS.find((t) => t.id === selected)?.credits}.
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirm}
              disabled={saving}
              className="px-4 py-1.5 rounded-full bg-amber-900 text-amber-50 text-xs font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Confirm"}
            </button>
            <button
              onClick={cancel}
              disabled={saving}
              className="px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold hover:bg-amber-200 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {saved && (
        <p className="mt-3 text-sm text-emerald-700">Preference saved.</p>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
