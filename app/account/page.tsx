import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { currentBillingMonth } from "@/lib/plans";
import { SignOutButton } from "@/components/SignOutButton";
import { GenerationsGrid } from "@/components/GenerationsGrid";
import { ModelPreference } from "@/components/ModelPreference";

export const metadata = { title: "Your account" };
export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { purchase?: string };
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/account");
  }

  const service = createSupabaseServiceClient();
  const billingMonth = currentBillingMonth();

  const [{ data: balance }, { data: purchases }, { data: generations, error: genError }, { data: profile }] = await Promise.all([
    service
      .from("credit_balances")
      .select("credits_remaining, unlimited")
      .eq("user_id", user.id)
      .eq("billing_month", billingMonth)
      .maybeSingle(),
    service
      .from("purchases")
      .select("plan_id, credits_granted, unlimited, amount_cents, currency, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    service
      .from("generations")
      .select("id, image_path, prompt, mode, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(24),
    service
      .from("profiles")
      .select("preferred_model")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (genError) {
    console.error("generations query error:", genError);
  }

  const isUnlimited = !!balance?.unlimited;
  const credits = balance?.credits_remaining ?? 0;
  const preferredModel = (profile?.preferred_model ?? "standard") as "standard" | "enhanced" | "premium";

  // Sign URLs for each thumbnail (1 hour). The bucket is private.
  const history = await Promise.all(
    (generations ?? []).map(async (g) => {
      const { data: signed } = await service.storage
        .from("prompt-images")
        .createSignedUrl(g.image_path, 60 * 60);
      return { ...g, url: signed?.signedUrl ?? null };
    })
  );

  return (
    <main>
      <Header />
      <section className="max-w-3xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-20">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Your account</h1>
            <p className="mt-1 text-ink/60 text-sm">{user.email}</p>
          </div>
          <SignOutButton />
        </div>

        {searchParams.purchase === "success" && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-4 py-3 text-sm">
            Payment received — credits are applied to your account.
          </div>
        )}

        <div className="rounded-3xl bg-ink text-paper p-7 sm:p-8 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.4)]">
          <div className="text-sm text-paper/60">This month ({billingMonth})</div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-6xl font-extrabold tracking-tight">
              {isUnlimited ? "∞" : credits}
            </span>
            <span className="text-paper/60 text-lg">
              {isUnlimited ? "unlimited generations" : "credits left"}
            </span>
          </div>
          <p className="mt-3 text-paper/60 text-sm">
            Credits expire at the end of this month. Buying again next month tops you back up.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/image-to-prompt"
              className="inline-flex items-center px-4 py-2.5 rounded-full bg-accent-lime text-ink text-sm font-semibold hover:opacity-90"
            >
              Use a credit →
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center px-4 py-2.5 rounded-full bg-white/10 border border-white/15 text-paper text-sm font-semibold hover:bg-white/20"
            >
              Buy more credits
            </Link>
          </div>
        </div>

        <h2 className="mt-12 mb-4 text-sm font-semibold text-ink/70 uppercase tracking-wide">
          AI model
        </h2>
        <p className="mb-4 text-sm text-ink/60">
          Choose the model used for every generation. Higher tiers produce better composition and detail but cost more credits per use.
        </p>
        <ModelPreference initial={preferredModel} />

        <h2 className="mt-12 mb-4 text-sm font-semibold text-ink/70 uppercase tracking-wide">
          Your generations
        </h2>
        {genError && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-3">
            DB error: {genError.message}
          </p>
        )}
        {history.length > 0 ? (
          <GenerationsGrid items={history} />
        ) : (
          <p className="text-sm text-ink/55">No generations yet. Make your first one!</p>
        )}

        <h2 className="mt-12 mb-4 text-sm font-semibold text-ink/70 uppercase tracking-wide">
          Recent purchases
        </h2>
        {purchases && purchases.length > 0 ? (
          <ul className="divide-y divide-black/5 rounded-2xl border border-black/5 bg-white overflow-hidden">
            {purchases.map((p, idx) => (
              <li key={idx} className="px-5 py-3 flex items-center justify-between gap-3 text-sm">
                <div>
                  <div className="font-semibold text-ink capitalize">{p.plan_id}</div>
                  <div className="text-ink/50 text-xs">
                    {p.created_at.slice(0, 10)} ·{" "}
                    {p.unlimited ? "Unlimited month" : `+${p.credits_granted} credits`}
                  </div>
                </div>
                <div className="text-ink/70">
                  ${(p.amount_cents / 100).toFixed(2)} {p.currency.toUpperCase()}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink/55">No purchases yet.</p>
        )}
      </section>
      <Footer />
    </main>
  );
}
