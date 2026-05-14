import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PLANS } from "@/lib/plans";
import { BuyButton } from "@/components/BuyButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Pricing — pay once, credits reset each month",
  description:
    "Simple monthly credit packs for image-to-prompt. No subscription — credits expire at the end of the month.",
};

export default async function PricingPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signedIn = !!user;

  return (
    <main>
      <Header />
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
            Pay once. Use this month.
          </h1>
          <p className="mt-4 text-ink/60 max-w-xl mx-auto">
            No subscription. Buy a pack, use it before the month ends. Need more? Just buy again.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((plan, i) => {
            const isMiddle = i === 1;
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl border p-7 sm:p-8 flex flex-col ${
                  isMiddle
                    ? "bg-ink text-paper border-ink shadow-[0_20px_40px_-20px_rgba(0,0,0,0.4)]"
                    : "bg-white border-black/5 shadow-[0_1px_0_rgba(0,0,0,0.03),0_20px_40px_-20px_rgba(0,0,0,0.08)]"
                }`}
              >
                {isMiddle && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent-lime text-ink text-xs font-bold uppercase tracking-wide">
                    Best value
                  </span>
                )}
                <div className={`text-sm font-semibold ${isMiddle ? "text-paper/70" : "text-ink/70"}`}>
                  {plan.name}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold tracking-tight">{plan.priceLabel}</span>
                  <span className={`text-sm ${isMiddle ? "text-paper/60" : "text-ink/50"}`}>/ month</span>
                </div>
                <p className={`mt-3 text-sm ${isMiddle ? "text-paper/70" : "text-ink/60"}`}>
                  {plan.blurb}
                </p>
                <ul className={`mt-6 space-y-2.5 text-sm ${isMiddle ? "text-paper/85" : "text-ink/75"}`}>
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className={isMiddle ? "text-accent-lime" : "text-ink"} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  <BuyButton planId={plan.id} signedIn={signedIn} primary={isMiddle} />
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-ink/50">
          Credits expire at the end of the calendar month they were purchased in. Buying again next
          month gives you a fresh balance.
        </p>
      </section>
      <Footer />
    </main>
  );
}

function Check({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`mt-0.5 shrink-0 ${className}`}
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
