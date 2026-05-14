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

  const service = createSupabaseServiceClient();

  // ── invoice.paid ──────────────────────────────────────────────────────────
  // Fires on every successful charge: initial subscription AND each renewal.
  // This is the single source of truth for granting credits.
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice & {
      subscription?: string | null;
      payment_intent?: string | null;
    };

    // Only process subscription invoices.
    if (!invoice.subscription) {
      return NextResponse.json({ received: true, ignored: "not a subscription invoice" });
    }

    // Idempotency: skip if this invoice was already processed.
    const { data: existing } = await service
      .from("purchases")
      .select("id")
      .eq("stripe_session_id", invoice.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Retrieve subscription to get plan metadata.
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    );
    const userId = subscription.metadata?.supabase_user_id;
    const planId = subscription.metadata?.plan_id;

    if (!userId || !planId) {
      console.error("invoice.paid: missing subscription metadata", subscription.id);
      return NextResponse.json({ error: "Missing subscription metadata" }, { status: 400 });
    }

    const plan = findPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
    }

    const billingMonth = currentBillingMonth();
    const isUnlimited = plan.credits === "unlimited";
    const creditsToGrant = isUnlimited ? 0 : (plan.credits as number);

    // RESET (not add) credits for this month — subscription grants a fresh
    // allowance each billing cycle, not a top-up on existing balance.
    const { error: upsertErr } = await service.from("credit_balances").upsert(
      {
        user_id: userId,
        billing_month: billingMonth,
        credits_remaining: creditsToGrant,
        unlimited: isUnlimited,
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
      amount_cents: invoice.amount_paid,
      currency: invoice.currency ?? "usd",
      stripe_session_id: invoice.id,
      stripe_payment_intent:
        typeof invoice.payment_intent === "string" ? invoice.payment_intent : null,
    });

    return NextResponse.json({ received: true });
  }

  // ── customer.subscription.deleted ─────────────────────────────────────────
  // Subscription was cancelled (immediately or after period end).
  // Credits for the current month stay until they expire naturally — no
  // action needed. We log it for visibility only.
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    console.log(
      `Subscription cancelled: ${subscription.id} for user ${subscription.metadata?.supabase_user_id}`
    );
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
