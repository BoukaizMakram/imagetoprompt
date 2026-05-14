import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_EXTS = new Set(["png", "jpg", "jpeg", "webp", "gif"]);
const ANON_TRIES_COOKIE = "anon_tries";
const ANON_TRIES_LIMIT = 1;

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anonymous users get ANON_TRIES_LIMIT free generations tracked via cookie.
  // Once consumed, they're prompted to sign up.
  if (!user) {
    const used = Number(req.cookies.get(ANON_TRIES_COOKIE)?.value || "0");
    if (used >= ANON_TRIES_LIMIT) {
      return NextResponse.json(
        {
          error: "Sign up to keep generating — you get 2 more free tries.",
          code: "needs_signup",
        },
        { status: 401 }
      );
    }
  }

  let body: { ext?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const rawExt = (body.ext || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeExt = ALLOWED_EXTS.has(rawExt) ? (rawExt === "jpeg" ? "jpg" : rawExt) : "png";
  const id = crypto.randomUUID();
  const folder = user ? user.id : "anonymous";
  const path = `${folder}/${id}.${safeExt}`;

  const service = createSupabaseServiceClient();
  const { data, error } = await service.storage
    .from("prompt-images")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Could not get upload URL." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    path,
    token: data.token,
    signedUrl: data.signedUrl,
    generationId: id,
  });
}
