import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { findPlan } from "@/lib/plans";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { planId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const plan = findPlan(body.planId);
  if (!plan) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  const priceId = process.env[plan.stripePriceEnv];
  if (!priceId) {
    return NextResponse.json(
      {
        error: `Server is missing ${plan.stripePriceEnv}. Add the Stripe Price ID for the "${plan.name}" plan to .env.local.`,
      },
      { status: 500 }
    );
  }

  const origin =
    req.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    new URL(req.url).origin;

  const stripe = getStripe();

  // Reuse a Stripe customer per user when possible.
  const service = createSupabaseServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .maybeSingle();

  let customerId = profile?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? profile?.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await service.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${origin}/account?purchase=success`,
    cancel_url: `${origin}/pricing?purchase=cancelled`,
    metadata: {
      supabase_user_id: user.id,
      plan_id: plan.id,
    },
    payment_intent_data: {
      metadata: {
        supabase_user_id: user.id,
        plan_id: plan.id,
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
