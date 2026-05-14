import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Tier = "standard" | "enhanced" | "premium";

export async function PATCH(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { tier?: Tier };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const tier = body.tier;
  if (!tier || !["standard", "enhanced", "premium"].includes(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const service = createSupabaseServiceClient();
  const { error } = await service
    .from("profiles")
    .update({ preferred_model: tier, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not save preference" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, tier });
}
