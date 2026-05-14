"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlanId } from "@/lib/plans";

export function BuyButton({
  planId,
  signedIn,
  primary,
}: {
  planId: PlanId;
  signedIn: boolean;
  primary?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setError(null);
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent("/pricing")}`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { /* non-JSON error page */ }
      if (!res.ok || !data.url) throw new Error(data?.error || `Checkout failed (${res.status})`);
      window.location.href = data.url as string;
    } catch (e: any) {
      setError(e.message || "Could not start checkout.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={buy}
        disabled={loading}
        className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition disabled:opacity-50 ${
          primary
            ? "bg-accent-lime text-ink hover:opacity-90"
            : "bg-ink text-paper hover:opacity-90"
        }`}
      >
        {loading ? "Loading…" : signedIn ? "Buy this pack" : "Sign in to buy"}
      </button>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </>
  );
}
