export type PlanId = "starter" | "pro" | "unlimited";

export type Plan = {
  id: PlanId;
  name: string;
  priceLabel: string;
  priceCents: number;
  credits: number | "unlimited";
  blurb: string;
  features: string[];
  // Stripe Price ID for the one-time purchase. Set in env.
  stripePriceEnv: string;
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceLabel: "$9.99",
    priceCents: 999,
    credits: 300,
    blurb: "300 image-to-prompt generations this month.",
    features: [
      "300 generations / month",
      "All prompt modes (Flux, Midjourney, SD…)",
      "Credits reset every billing cycle",
      "Cancel anytime",
    ],
    stripePriceEnv: "STRIPE_PRICE_STARTER",
  },
  {
    id: "pro",
    name: "Pro",
    priceLabel: "$18.99",
    priceCents: 1899,
    credits: 600,
    blurb: "600 image-to-prompt generations this month.",
    features: [
      "600 generations / month",
      "All prompt modes",
      "Best value per generation",
      "Cancel anytime",
    ],
    stripePriceEnv: "STRIPE_PRICE_PRO",
  },
  {
    id: "unlimited",
    name: "Unlimited",
    priceLabel: "$100",
    priceCents: 10000,
    credits: "unlimited",
    blurb: "Unlimited generations for the rest of this month.",
    features: [
      "Unlimited generations / month",
      "All prompt modes",
      "Priority server access",
      "Cancel anytime",
    ],
    stripePriceEnv: "STRIPE_PRICE_UNLIMITED",
  },
];

export function findPlan(id: string | null | undefined): Plan | undefined {
  if (!id) return undefined;
  return PLANS.find((p) => p.id === id);
}

// Number of free credits granted on signup so first-time users can try the tool.
export const FREE_TRIAL_CREDITS = 2;

// Returns YYYY-MM string for the current UTC month. Credits expire at the end of
// the calendar month they were purchased in.
export function currentBillingMonth(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
