import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Mode = "general" | "flux" | "midjourney" | "stable-diffusion";

const SYSTEM_BY_MODE: Record<Mode, string> = {
  general:
    "You are an expert at writing rich, natural-language prompts for AI image generators. Describe what you see in the image in vivid, concrete detail: subject, composition, lighting, mood, color palette, style, medium, camera and lens cues if relevant. Output ONE single paragraph, no preamble, no list, no quotes, no markdown.",
  flux:
    "You are a prompt engineer for the Flux family of image models. Describe the image as a single cinematic paragraph optimized for Flux. Mention subject, action, environment, lighting (kelvin/time of day), lens, depth of field, color grade, and overall mood. No lists, no quotes, no markdown — one paragraph only.",
  midjourney:
    "You are a Midjourney prompt engineer. Describe the image as a single comma-separated Midjourney prompt: subject, style, lighting, mood, palette, medium, camera/lens, then end with sensible parameter suggestions like --ar 16:9 --style raw. No quotes, no markdown, single line.",
  "stable-diffusion":
    "You are a Stable Diffusion prompt engineer. Output a comma-separated tag-style prompt describing subject, attributes, environment, lighting, style, medium, and quality tags (e.g. masterpiece, ultra detailed, 8k). No quotes, no markdown, single line.",
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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const image = form.get("image");
  const mode = (form.get("mode") as Mode) || "general";

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }
  if (!image.type.startsWith("image/")) {
    return NextResponse.json({ error: "Uploaded file is not an image" }, { status: 400 });
  }
  if (image.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Image too large (max 8 MB)" }, { status: 400 });
  }

  const systemPrompt = SYSTEM_BY_MODE[mode] ?? SYSTEM_BY_MODE.general;
  const userPrompt =
    "Describe this image as a prompt I can paste into an AI image generator to recreate or remix it. Be specific about subject, composition, lighting, color, style, and mood.";

  const buf = Buffer.from(await image.arrayBuffer());
  const imageBytes = Array.from(new Uint8Array(buf));

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/llava-hf/llava-1.5-7b-hf`;

  // Step 1 — content moderation pass. Reject NSFW, sexual, violent, or otherwise unsafe images.
  const moderationPrompt =
    "Look at this image and answer with a single line in the exact format: SAFE or UNSAFE: <short reason>. Mark UNSAFE if the image contains any of: nudity, partial nudity, lingerie, swimwear in suggestive context, sexual or pornographic content, sexually suggestive poses, exposed intimate body parts, gore, graphic violence, blood, weapons used against people, hateful symbols, drugs, or any content depicting minors in a sexualized or inappropriate way. Otherwise mark SAFE.";

  const modResp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBytes,
      prompt: moderationPrompt,
      max_tokens: 64,
    }),
  });

  if (modResp.ok) {
    const modData = (await modResp.json()) as {
      result?: { description?: string; response?: string };
    };
    const verdict = (modData?.result?.description ?? modData?.result?.response ?? "").trim();
    if (/^\s*unsafe\b/i.test(verdict) || /\bnsfw\b|nude|porn|sexual/i.test(verdict)) {
      return NextResponse.json(
        {
          error:
            "This image violates our content policy. NSFW, sexual, violent, or otherwise inappropriate content is not allowed.",
        },
        { status: 400 }
      );
    }
  }

  // Step 2 — generate the prompt.
  const body = {
    image: imageBytes,
    prompt: `${systemPrompt}\n\n${userPrompt}`,
    max_tokens: 512,
  };

  const cf = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!cf.ok) {
    const text = await cf.text();
    return NextResponse.json(
      { error: `Cloudflare AI error (${cf.status}): ${text.slice(0, 500)}` },
      { status: 502 }
    );
  }

  const data = (await cf.json()) as {
    result?: { description?: string; response?: string };
    success?: boolean;
    errors?: unknown[];
  };

  const raw =
    data?.result?.description ??
    data?.result?.response ??
    "";

  const prompt = cleanPrompt(raw);

  if (!prompt) {
    return NextResponse.json({ error: "Empty response from model" }, { status: 502 });
  }

  return NextResponse.json({ prompt, mode });
}

function cleanPrompt(s: string): string {
  return s
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^prompt:\s*/i, "")
    .replace(/\s+\n/g, "\n")
    .trim();
}
