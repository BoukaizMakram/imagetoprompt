import { NextRequest, NextResponse } from "next/server";
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
  | "stable-diffusion";

const LLAVA = "@cf/llava-hf/llava-1.5-7b-hf";
const LLAMA = "@cf/meta/llama-3.1-8b-instruct";

const ANON_TRIES_COOKIE = "anon_tries";
const ANON_TRIES_LIMIT = 1;
// 30 days — anonymous users get one try per device per month.
const ANON_TRIES_MAX_AGE = 60 * 60 * 24 * 30;

// Mode-specific instructions for the second-pass text model.
const TRANSFORM_BY_MODE: Record<Mode, string> = {
  general: `Rewrite the caption above into ONE single rich paragraph that an artist can paste straight into an AI image generator. Start directly with the subject (e.g. "A close-up of...", "An aerial view of...", "Two figures..."). Weave in: subject, action, environment, composition / framing, lighting, color palette, mood, style, medium, and camera or lens cues if relevant. Do NOT say "The image shows" or any meta-description. Output ONLY the prompt, no preamble, no quotes, no markdown.`,

  structured: `Rewrite the caption above into a labeled prompt. Output ONLY these lines, in this exact order, with concrete prompt-style values (not sentences about the image):
Subject: <subject and pose/action>
Composition: <framing, angle, depth>
Lighting: <quality, direction, time of day>
Color palette: <dominant colors and contrast>
Mood: <emotional tone>
Style / medium: <art style, render or photography type>
Details: <textures, materials, small focal elements>
Do NOT add any other lines, no intro, no explanation, no markdown.`,

  "graphic-design": `Rewrite the caption above as a prompt for an AI graphic-design generator (poster, cover, layout, branding). Output ONE single paragraph starting with the design subject (e.g. "A minimalist poster of...", "A vintage album cover featuring..."). Emphasize layout, visual hierarchy, typography (serif/sans/display weight), color palette, shapes, negative space, texture, era/style influence, and overall brand mood. Do NOT say "The image shows" or any meta phrasing. Output ONLY the prompt.`,

  json: `Convert the caption above into a single valid JSON object that an artist could use to generate a similar image. Output ONLY the JSON — no prose, no markdown, no code fences. Start with { and end with }.

Use this exact schema and fill EVERY field with rich, concrete, multi-word prompt fragments (NOT one-word answers). "details" should contain 4–8 specific visual elements. "negative" should contain 3–6 things to avoid (e.g. "blurry", "low quality", "extra fingers", "watermark", "deformed face").

{
  "subject": "<detailed subject phrase, multiple words>",
  "action": "<what the subject is doing or how they are posed>",
  "setting": "<environment / location with descriptive detail>",
  "composition": "<framing, angle, depth, focal point>",
  "lighting": "<quality, direction, color temperature, time of day>",
  "color_palette": "<dominant colors with mood, e.g. 'warm amber and deep teal with muted cream highlights'>",
  "mood": "<emotional tone, descriptive>",
  "style": "<art style or visual influence>",
  "medium": "<photography type, illustration, 3D render, painting, etc>",
  "camera": "<camera, lens, aperture cues, e.g. 'shot on 85mm at f/1.4, shallow depth of field'>",
  "details": ["<detail 1>", "<detail 2>", "<detail 3>", "<detail 4>"],
  "negative": ["<thing to avoid 1>", "<thing to avoid 2>", "<thing to avoid 3>"]
}`,

  flux: `Rewrite the caption above as a prompt for the Flux image model. Output ONE single cinematic paragraph starting with the subject (e.g. "A...", "An..."). Cover subject + action, environment, lighting (kelvin / time of day), lens and depth of field, color grade, and overall mood. Do NOT say "The image shows". Output ONLY the prompt, no preamble, no markdown.`,

  midjourney: `Rewrite the caption above as a Midjourney prompt. Output ONE single line, comma-separated, starting with the subject: subject, environment, style, lighting, mood, palette, medium, camera/lens. End the line with sensible parameters like --ar 16:9 --style raw --v 6. No quotes, no markdown, no preamble. Start directly with the subject phrase, never with "The image".`,

  "stable-diffusion": `Rewrite the caption above as a Stable Diffusion prompt. Output ONE single line of comma-separated tags starting with the subject, followed by attributes, environment, lighting, style, medium, and quality tags (masterpiece, ultra detailed, 8k, sharp focus). No quotes, no markdown, no preamble. Start directly with the subject tag.`,
};

export async function POST(req: NextRequest) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return NextResponse.json(
      {
        error:
          "Server is missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN. Add them to .env.local and restart.",
      },
      { status: 500 }
    );
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAnonymous = !user;

  // Anonymous users get a limited number of free tries tracked via cookie.
  if (isAnonymous) {
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

  // The browser uploads the image directly to Supabase Storage and posts
  // us the path + mode as JSON. That keeps the serverless function body
  // tiny (well under Vercel's 4.5 MB limit) regardless of image size.
  let body: { imagePath?: string; mode?: Mode };
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
  // Path ownership: signed-in users must use their own folder; anonymous
  // requests must use the shared `anonymous/` folder.
  const expectedPrefix = user ? `${user.id}/` : "anonymous/";
  if (!imagePath.startsWith(expectedPrefix) || imagePath.includes("..")) {
    return NextResponse.json({ error: "Invalid image path" }, { status: 400 });
  }

  const service = createSupabaseServiceClient();
  const { data: blob, error: dlErr } = await service.storage
    .from("prompt-images")
    .download(imagePath);
  if (dlErr || !blob) {
    return NextResponse.json({ error: "Could not load image" }, { status: 400 });
  }
  if (blob.size > 30 * 1024 * 1024) {
    await service.storage.from("prompt-images").remove([imagePath]);
    return NextResponse.json({ error: "Image too large (max 30 MB)" }, { status: 400 });
  }
  if (!blob.type.startsWith("image/")) {
    await service.storage.from("prompt-images").remove([imagePath]);
    return NextResponse.json({ error: "Uploaded file is not an image" }, { status: 400 });
  }

  // Atomically consume one credit (signed-in users only). Returns -1 if
  // no credits left. Anonymous users are gated by the cookie above.
  const billingMonth = currentBillingMonth();
  let remaining: number | null = null;
  if (user) {
    const { data: rpcRemaining, error: consumeErr } = await service.rpc("consume_credit", {
      p_user_id: user.id,
      p_billing_month: billingMonth,
    });
    if (consumeErr) {
      return NextResponse.json(
        { error: "Could not check your plan. Try again." },
        { status: 500 }
      );
    }
    if (typeof rpcRemaining !== "number" || rpcRemaining < 0) {
      await service.storage.from("prompt-images").remove([imagePath]);
      return NextResponse.json(
        {
          error: "You're out of credits for this month. Buy a plan to keep generating.",
          code: "out_of_credits",
        },
        { status: 402 }
      );
    }
    remaining = rpcRemaining;
  }

  // Refund the credit (if any) + clean up the orphan image when
  // generation fails. Anonymous failures just delete the orphan.
  const cleanupOnFailure = async () => {
    const tasks: PromiseLike<unknown>[] = [
      service.storage.from("prompt-images").remove([imagePath]),
    ];
    if (user) {
      tasks.push(
        service.rpc("refund_credit", {
          p_user_id: user.id,
          p_billing_month: billingMonth,
        }) as unknown as PromiseLike<unknown>
      );
    }
    await Promise.all(tasks);
  };

  const buf = Buffer.from(await blob.arrayBuffer());
  const imageBytes = Array.from(new Uint8Array(buf));

  // ──────────────────────────────────────────────────────────
  // Step 1 — content moderation pass with LLaVA.
  // ──────────────────────────────────────────────────────────
  const moderationPrompt =
    "Look at this image and answer with one line in the exact format: SAFE or UNSAFE: <short reason>. Mark UNSAFE if the image contains any of: nudity, partial nudity, lingerie, swimwear in suggestive context, sexual or pornographic content, sexually suggestive poses, exposed intimate body parts, gore, graphic violence, blood, weapons used against people, hateful symbols, drugs, or any content depicting minors in a sexualized or inappropriate way. Otherwise mark SAFE.";

  const mod = await runLlava(accountId, apiToken, {
    image: imageBytes,
    prompt: moderationPrompt,
    max_tokens: 64,
  });
  if (mod.ok) {
    const verdict = mod.text.trim();
    if (/^\s*unsafe\b/i.test(verdict) || /\bnsfw\b|nude|porn|sexual/i.test(verdict)) {
      await cleanupOnFailure();
      return NextResponse.json(
        {
          error:
            "This image violates our content policy. NSFW, sexual, violent, or otherwise inappropriate content is not allowed.",
        },
        { status: 400 }
      );
    }
  }

  // ──────────────────────────────────────────────────────────
  // Step 2 — rich freeform caption from LLaVA (the "seeing" pass).
  // ──────────────────────────────────────────────────────────
  const captionInstruction =
    "Describe this image in vivid, exhaustive detail for an artist who cannot see it. " +
    "Cover, in this order: the main subject and what they are doing; secondary elements; the setting and environment; " +
    "composition (framing, angle, depth of field, focal point); lighting (quality, direction, color temperature, time of day); " +
    "the dominant color palette and how colors interact; textures and materials; mood and emotional tone; " +
    "apparent style, medium, and any photographic or rendering cues (lens, aperture, film stock, 3D render, illustration style). " +
    "Write a long, detailed paragraph of at least 6 sentences. Be specific and concrete — name colors, materials, and shapes precisely.";

  const caption = await runLlava(accountId, apiToken, {
    image: imageBytes,
    prompt: captionInstruction,
    max_tokens: 768,
  });
  if (!caption.ok || !caption.text.trim()) {
    await cleanupOnFailure();
    return NextResponse.json(
      { error: caption.error || "Could not read the image." },
      { status: 502 }
    );
  }
  const description = caption.text.trim();

  // ──────────────────────────────────────────────────────────
  // Step 3 — Llama 3.1 transforms the description into the chosen mode.
  // ──────────────────────────────────────────────────────────
  const transformInstruction = TRANSFORM_BY_MODE[mode] ?? TRANSFORM_BY_MODE.general;
  const llamaResult = await runLlama(accountId, apiToken, {
    messages: [
      {
        role: "system",
        content:
          "You are an expert prompt engineer for AI image generators. Always produce paste-ready prompts. Never describe the image meta-fashion ('the image shows', 'in this picture'). Follow the user's output format exactly.",
      },
      {
        role: "user",
        content: `IMAGE CAPTION:\n${description}\n\nTASK:\n${transformInstruction}`,
      },
    ],
    max_tokens: mode === "json" ? 1024 : 700,
    temperature: 0.6,
  });

  // Best-effort logging + history persistence (signed-in users only).
  const logUsage = async () => {
    if (!user) return;
    await service.from("usage_events").insert({
      user_id: user.id,
      billing_month: billingMonth,
      kind: "image_to_prompt",
      metadata: { mode },
    });
  };

  const persistGeneration = async (finalPrompt: string) => {
    if (!user) return;
    const { error } = await service.from("generations").insert({
      user_id: user.id,
      image_path: imagePath,
      prompt: finalPrompt,
      mode,
    });
    if (error) {
      // Don't fail the user-facing request, but make sure it's visible in logs
      // (silent swallowing here previously hid a missing-table issue).
      console.error("persistGeneration failed:", error);
    }
  };

  // Anonymous: no history at all, so delete the image once we're done.
  const cleanupAnonymousImage = async () => {
    if (user) return;
    await service.storage.from("prompt-images").remove([imagePath]);
  };

  // Wraps a JSON response so anonymous successes also bump the cookie.
  const finish = (payload: Record<string, unknown>) => {
    const res = NextResponse.json(payload);
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
  };

  if (!llamaResult.ok || !llamaResult.text.trim()) {
    // Fall back to the raw caption cleaned up if Llama is unavailable.
    const fallback = cleanPrompt(description);
    await Promise.all([logUsage(), persistGeneration(fallback), cleanupAnonymousImage()]);
    return finish({ prompt: fallback, mode, creditsRemaining: remaining });
  }

  const cleaned =
    mode === "json" ? cleanJson(llamaResult.text) : cleanPrompt(llamaResult.text);
  if (!cleaned) {
    await cleanupOnFailure();
    return NextResponse.json({ error: "Empty response from model" }, { status: 502 });
  }
  await Promise.all([logUsage(), persistGeneration(cleaned), cleanupAnonymousImage()]);
  return finish({ prompt: cleaned, mode, creditsRemaining: remaining });
}

// ──────────────────────────────────────────────────────────────
// Workers AI helpers
// ──────────────────────────────────────────────────────────────

type LlavaInput = { image: number[]; prompt: string; max_tokens?: number };

async function runLlava(
  accountId: string,
  token: string,
  input: LlavaInput
): Promise<{ ok: boolean; text: string; error?: string }> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${LLAVA}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!r.ok) {
    const t = await r.text();
    return { ok: false, text: "", error: `LLaVA error (${r.status}): ${t.slice(0, 400)}` };
  }
  const j = (await r.json()) as {
    result?: { description?: string; response?: string };
  };
  const text = j?.result?.description ?? j?.result?.response ?? "";
  return { ok: true, text };
}

type LlamaInput = {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  max_tokens?: number;
  temperature?: number;
};

async function runLlama(
  accountId: string,
  token: string,
  input: LlamaInput
): Promise<{ ok: boolean; text: string; error?: string }> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${LLAMA}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!r.ok) {
    const t = await r.text();
    return { ok: false, text: "", error: `Llama error (${r.status}): ${t.slice(0, 400)}` };
  }
  const j = (await r.json()) as { result?: { response?: string } };
  const text = j?.result?.response ?? "";
  return { ok: true, text };
}

// ──────────────────────────────────────────────────────────────
// Output cleaners
// ──────────────────────────────────────────────────────────────

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
    const parsed = JSON.parse(out);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return out;
  }
}
