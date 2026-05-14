import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { currentBillingMonth } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Mode =
  | "general"
  | "structured"
  | "graphic-design"
  | "json"
  | "flux"
  | "midjourney"
  | "stable-diffusion"
  | "gpt-image-2";

type Tier = "standard" | "enhanced" | "premium";

const TIER_CREDITS: Record<Tier, number> = {
  standard: 1,
  enhanced: 2,
  premium: 3,
};

const ANON_TRIES_COOKIE = "anon_tries";
const ANON_TRIES_LIMIT = 1;
const ANON_TRIES_MAX_AGE = 60 * 60 * 24 * 30;

const TRANSFORM_BY_MODE: Record<Mode, string> = {
  general: `Using your analysis, write ONE single rich paragraph that an artist can paste straight into an AI image generator. Start directly with the subject (e.g. "A close-up of...", "An aerial view of...", "Two figures..."). Weave in: subject, action, environment, composition/framing, lighting, color palette, mood, style, medium, and camera or lens cues if relevant. Do NOT say "The image shows" or any meta-description. Output ONLY the prompt, no preamble, no quotes, no markdown.`,

  structured: `Using your analysis, write a labeled prompt. Output ONLY these lines in this exact order with concrete prompt-style values (not sentences):
Subject: <subject and pose/action>
Composition: <framing, angle, depth>
Lighting: <quality, direction, time of day>
Color palette: <dominant colors and contrast>
Mood: <emotional tone>
Style / medium: <art style, render or photography type>
Details: <textures, materials, small focal elements>
No other lines, no intro, no explanation, no markdown.`,

  "graphic-design": `Using your analysis, write a prompt for an AI graphic-design generator (poster, cover, layout, branding). ONE single paragraph starting with the design subject. Emphasize layout, visual hierarchy, typography, color palette, shapes, negative space, texture, era/style influence, and brand mood. Do NOT say "The image shows". Output ONLY the prompt.`,

  json: `Using your analysis, output a single valid JSON object an artist could use to recreate a similar image. Output ONLY the JSON — no prose, no markdown, no code fences. Start with { and end with }.

Use this exact schema with rich, concrete, multi-word values. "details" should have 4–8 specific elements. "negative" should have 3–6 things to avoid.

{
  "subject": "<detailed subject phrase>",
  "action": "<what subject is doing or how posed>",
  "setting": "<environment/location with detail>",
  "composition": "<framing, angle, depth, focal point>",
  "lighting": "<quality, direction, color temperature, time of day>",
  "color_palette": "<dominant colors with mood>",
  "mood": "<emotional tone>",
  "style": "<art style or visual influence>",
  "medium": "<photography type, illustration, 3D render, painting, etc>",
  "camera": "<camera, lens, aperture cues>",
  "details": ["<detail 1>", "<detail 2>", "<detail 3>", "<detail 4>"],
  "negative": ["<avoid 1>", "<avoid 2>", "<avoid 3>"]
}`,

  flux: `Using your analysis, write a Flux image model prompt. ONE single cinematic paragraph starting with the subject. Cover subject + action, environment, lighting (kelvin/time of day), lens and depth of field, color grade, and overall mood. Do NOT say "The image shows". Output ONLY the prompt, no preamble, no markdown.`,

  midjourney: `Using your analysis, write a Midjourney prompt. ONE single comma-separated line starting with the subject: subject, environment, style, lighting, mood, palette, medium, camera/lens. End with sensible parameters like --ar 16:9 --style raw --v 6. No quotes, no markdown, no preamble. Start directly with the subject phrase, never with "The image".`,

  "stable-diffusion": `Using your analysis, write a Stable Diffusion prompt. ONE single line of comma-separated tags starting with the subject, followed by attributes, environment, lighting, style, medium, and quality tags (masterpiece, ultra detailed, 8k, sharp focus). No quotes, no markdown, no preamble.`,

  "gpt-image-2": `Using your analysis, write a prompt for OpenAI's GPT Image 2 model. ONE single precise paragraph in natural language — complete sentences, not a keyword list. Specify: subject and action, exact environment and setting, lighting quality and direction, color palette and contrast, mood and atmosphere, visual style or medium, and compositional choices (angle, framing, depth). If text needs to appear in the image, include it in quotes. Do NOT say "The image shows". Output ONLY the prompt.`,
};

const VISION_INSTRUCTION = (modeInstruction: string) =>
  `First, if this image contains nudity, explicit sexual content, graphic violence, or clearly illegal content, respond ONLY with "UNSAFE: [brief reason]" and stop.

Otherwise, analyze this image carefully, paying close attention to:
- Main subject: who/what it is, what they're doing
- Secondary elements and background details
- COMPOSITION: camera angle, framing, rule of thirds, leading lines, depth of field, focal point, perspective
- Lighting: quality (hard/soft/diffuse), direction, color temperature, time of day, shadows
- Color palette: dominant hues, contrast, saturation, color relationships
- Textures, materials, surfaces
- Mood and emotional atmosphere
- Visual style, medium (photography, illustration, painting, 3D render, etc.), and any photographic/rendering cues (lens, aperture, film stock, render engine)

Then do the following with your analysis:

${modeInstruction}`;

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAnonymous = !user;

  if (isAnonymous) {
    const used = Number(req.cookies.get(ANON_TRIES_COOKIE)?.value || "0");
    if (used >= ANON_TRIES_LIMIT) {
      return NextResponse.json(
        { error: "Sign up to keep generating — you get 2 more free tries.", code: "needs_signup" },
        { status: 401 }
      );
    }
  }

  let body: { imagePath?: string; mode?: Mode; tier?: Tier };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const imagePath = body.imagePath;
  const mode: Mode = (body.mode as Mode) || "general";

  if (!imagePath || typeof imagePath !== "string") {
    return NextResponse.json({ error: "Missing imagePath" }, { status: 400 });
  }
  const expectedPrefix = user ? `${user.id}/` : "anonymous/";
  if (!imagePath.startsWith(expectedPrefix) || imagePath.includes("..")) {
    return NextResponse.json({ error: "Invalid image path" }, { status: 400 });
  }

  const service = createSupabaseServiceClient();

  // Determine tier: request body overrides profile default.
  let tier: Tier = "standard";
  if (body.tier && ["standard", "enhanced", "premium"].includes(body.tier)) {
    tier = body.tier;
  } else if (user) {
    const { data: profile } = await service
      .from("profiles")
      .select("preferred_model")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.preferred_model && ["standard", "enhanced", "premium"].includes(profile.preferred_model)) {
      tier = profile.preferred_model as Tier;
    }
  }

  const creditCost = TIER_CREDITS[tier];
  const billingMonth = currentBillingMonth();
  let remaining: number | null = null;

  if (user) {
    const { data: rpcRemaining, error: consumeErr } = await service.rpc("consume_credit", {
      p_user_id: user.id,
      p_billing_month: billingMonth,
      p_amount: creditCost,
    });
    if (consumeErr) {
      return NextResponse.json({ error: "Could not check your plan. Try again." }, { status: 500 });
    }
    if (typeof rpcRemaining !== "number" || rpcRemaining < 0) {
      return NextResponse.json(
        {
          error: `You need ${creditCost} credits for this generation. Buy a plan to continue.`,
          code: "out_of_credits",
        },
        { status: 402 }
      );
    }
    remaining = rpcRemaining;
  }

  const { data: blob, error: dlErr } = await service.storage
    .from("prompt-images")
    .download(imagePath);
  if (dlErr || !blob) {
    await refundOnFailure(service, user?.id, billingMonth, creditCost);
    return NextResponse.json({ error: "Could not load image" }, { status: 400 });
  }
  if (blob.size > 30 * 1024 * 1024) {
    await service.storage.from("prompt-images").remove([imagePath]);
    await refundOnFailure(service, user?.id, billingMonth, creditCost);
    return NextResponse.json({ error: "Image too large (max 30 MB)" }, { status: 400 });
  }
  if (!blob.type.startsWith("image/")) {
    await service.storage.from("prompt-images").remove([imagePath]);
    await refundOnFailure(service, user?.id, billingMonth, creditCost);
    return NextResponse.json({ error: "Uploaded file is not an image" }, { status: 400 });
  }

  const buf = Buffer.from(await blob.arrayBuffer());
  const base64 = buf.toString("base64");
  const mediaType = (blob.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif") || "image/jpeg";

  const instruction = VISION_INSTRUCTION(TRANSFORM_BY_MODE[mode]);

  const OPENAI_MODEL: Record<Tier, string> = {
    standard: "gpt-4o-mini",
    enhanced: "gpt-4.1-mini",
    premium: "gpt-4.1",
  };

  let resultText: string;
  try {
    resultText = await runOpenAI(OPENAI_MODEL[tier], base64, mediaType, instruction);
  } catch (e: any) {
    await service.storage.from("prompt-images").remove([imagePath]);
    await refundOnFailure(service, user?.id, billingMonth, creditCost);
    return NextResponse.json({ error: e.message || "AI model error" }, { status: 502 });
  }

  if (/^\s*unsafe\b/i.test(resultText)) {
    await service.storage.from("prompt-images").remove([imagePath]);
    await refundOnFailure(service, user?.id, billingMonth, creditCost);
    return NextResponse.json(
      { error: "This image violates our content policy. NSFW, sexual, violent, or inappropriate content is not allowed." },
      { status: 400 }
    );
  }

  const cleaned = mode === "json" ? cleanJson(resultText) : cleanPrompt(resultText);
  if (!cleaned) {
    await service.storage.from("prompt-images").remove([imagePath]);
    await refundOnFailure(service, user?.id, billingMonth, creditCost);
    return NextResponse.json({ error: "Empty response from model" }, { status: 502 });
  }

  if (user) {
    await Promise.all([
      service.from("usage_events").insert({
        user_id: user.id,
        billing_month: billingMonth,
        kind: "image_to_prompt",
        metadata: { mode, tier },
      }),
      service.from("generations").insert({
        user_id: user.id,
        image_path: imagePath,
        prompt: cleaned,
        mode,
      }),
    ]);
  } else {
    await service.storage.from("prompt-images").remove([imagePath]);
  }

  const res = NextResponse.json({ prompt: cleaned, mode, tier, creditsRemaining: remaining });
  if (isAnonymous) {
    const used = Number(req.cookies.get(ANON_TRIES_COOKIE)?.value || "0");
    res.cookies.set(ANON_TRIES_COOKIE, String(used + 1), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ANON_TRIES_MAX_AGE,
    });
  }
  return res;
}

async function runOpenAI(
  model: string,
  base64: string,
  mediaType: string,
  instruction: string
): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model,
    max_tokens: 1024,
    messages: [
      {
        role: "system",
        content:
          "You are an expert prompt engineer for AI image generators. Produce paste-ready prompts. Never use meta-descriptions like 'the image shows'.",
      },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64}` } },
          { type: "text", text: instruction },
        ],
      },
    ],
  });
  return response.choices[0]?.message?.content ?? "";
}


async function refundOnFailure(
  service: ReturnType<typeof createSupabaseServiceClient>,
  userId: string | undefined,
  billingMonth: string,
  amount: number
) {
  if (!userId) return;
  await service.rpc("refund_credit", {
    p_user_id: userId,
    p_billing_month: billingMonth,
    p_amount: amount,
  });
}

function cleanPrompt(s: string): string {
  let out = s
    .trim()
    .replace(/^```[a-z]*\n?|```$/gi, "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^prompt:\s*/i, "")
    .replace(/\s+\n/g, "\n")
    .trim();

  const metaOpeners = [
    /^the\s+image\s+(shows|depicts|features|displays|presents|captures|portrays|contains|is\s+(of|a))\b[^.]*\.\s*/i,
    /^this\s+image\s+(shows|depicts|features|displays|presents|captures|portrays|contains|is\s+(of|a))\b[^.]*\.\s*/i,
    /^the\s+picture\s+(shows|depicts|features|displays|presents)\b[^.]*\.\s*/i,
    /^in\s+(the|this)\s+(image|picture|photo|photograph),?\s*/i,
    /^i\s+(can\s+)?see\b[^.]*\.\s*/i,
    /^here\s+is\s+(a|an|the)\b[^.]*\.\s*/i,
    /^this\s+is\s+(a|an|the)\b[^.]*\.\s*/i,
    /^there\s+(is|are)\b[^.]*\.\s*/i,
    /^it\s+(shows|depicts|features)\b[^.]*\.\s*/i,
  ];
  let changed = true;
  while (changed) {
    changed = false;
    for (const re of metaOpeners) {
      if (re.test(out)) {
        out = out.replace(re, "").trimStart();
        changed = true;
      }
    }
  }
  out = out.replace(/^the\s+image\s+(shows|depicts|features|portrays)\s+/i, "");
  if (out && /^[a-z]/.test(out)) out = out[0].toUpperCase() + out.slice(1);
  return out.trim();
}

function cleanJson(s: string): string {
  let out = s.trim().replace(/^```[a-z]*\n?|```$/gi, "").trim();
  const first = out.indexOf("{");
  const last = out.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    out = out.slice(first, last + 1);
  }
  try {
    return JSON.stringify(JSON.parse(out), null, 2);
  } catch {
    return out;
  }
}
