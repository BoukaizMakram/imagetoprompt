import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { findPlan, currentBillingMonth } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET not set" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const raw = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err: any) {
    return NextResponse.json({ error: `Bad signature: ${err.message}` }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true, ignored: "not paid" });
  }

  const userId = session.metadata?.supabase_user_id;
  const planId = session.metadata?.plan_id;
  if (!userId || !planId) {
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  const plan = findPlan(planId);
  if (!plan) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  const service = createSupabaseServiceClient();
  const billingMonth = currentBillingMonth();
  const isUnlimited = plan.credits === "unlimited";
  const creditsToGrant = isUnlimited ? 0 : (plan.credits as number);

  // Idempotency: skip if we've recorded this checkout session already.
  const { data: existing } = await service
    .from("purchases")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Read current balance for this user/month.
  const { data: current } = await service
    .from("credit_balances")
    .select("credits_remaining, unlimited")
    .eq("user_id", userId)
    .eq("billing_month", billingMonth)
    .maybeSingle();

  const newCredits = (current?.credits_remaining ?? 0) + creditsToGrant;
  const newUnlimited = isUnlimited || (current?.unlimited ?? false);

  const { error: upsertErr } = await service.from("credit_balances").upsert(
    {
      user_id: userId,
      billing_month: billingMonth,
      credits_remaining: newCredits,
      unlimited: newUnlimited,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,billing_month" }
  );

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  await service.from("purchases").insert({
    user_id: userId,
    plan_id: plan.id,
    billing_month: billingMonth,
    credits_granted: creditsToGrant,
    unlimited: isUnlimited,
    amount_cents: session.amount_total ?? plan.priceCents,
    currency: session.currency ?? "usd",
    stripe_session_id: session.id,
    stripe_payment_intent:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
  });

  return NextResponse.json({ received: true });
}
