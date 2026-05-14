"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compressImage";
import { BulkUploader } from "./BulkUploader";

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

const UPGRADE_TIER: Record<Tier, Tier | null> = {
  standard: "enhanced",
  enhanced: "premium",
  premium: null,
};

const UPGRADE_CREDITS: Record<Tier, number> = {
  standard: 2,
  enhanced: 3,
  premium: 0,
};

const MODE_HINTS: Record<Mode, string> = {
  general: "Natural-language prompt, paste-ready.",
  structured: "Subject, composition, lighting, mood — labeled and clean.",
  "graphic-design": "Layout, typography, palette, brand-feel cues.",
  json: "Machine-readable JSON of every detail.",
  flux: "Single cinematic paragraph tuned for Flux.",
  midjourney: "Comma-separated with --ar and style flags.",
  "stable-diffusion": "Tag-style prompt for SD / ComfyUI / A1111.",
  "gpt-image-2": "Natural prose optimized for GPT Image 2's reasoning engine.",
};

const MODE_GROUPS: { label: string; items: { id: Mode; label: string }[] }[] = [
  {
    label: "General",
    items: [
      { id: "general", label: "General Image Prompt" },
      { id: "structured", label: "Structured Prompt" },
    ],
  },
  {
    label: "Specialty",
    items: [
      { id: "graphic-design", label: "Graphic Design" },
      { id: "json", label: "JSON" },
    ],
  },
  {
    label: "Image generators",
    items: [
      { id: "gpt-image-2", label: "GPT Image 2" },
      { id: "flux", label: "Flux" },
      { id: "midjourney", label: "Midjourney" },
      { id: "stable-diffusion", label: "Stable Diffusion" },
    ],
  },
];

const EXAMPLES = [
  {
    src: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    prompt:
      "A close-up of a vibrant green circuit board with intricate copper traces, glowing components, and shallow depth of field. Cinematic lighting, macro photography, ultra-detailed, 8k.",
  },
  {
    src: "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=crop&w=800&q=80",
    prompt:
      "Portrait of a young man wearing a beige coat, standing against a soft pastel wall. Natural daylight, gentle shadows, editorial fashion photography, 35mm film grain.",
  },
  {
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    prompt:
      "A misty mountain valley at sunrise, golden light spilling through pine trees, layered fog drifting between ridges. Wide angle landscape, dramatic atmosphere, hyper-realistic.",
  },
];

export function PromptStudio({
  signedIn = false,
  credits = null,
  unlimited = false,
  defaultMode = "general",
  preferredTier = "standard",
}: {
  signedIn?: boolean;
  credits?: number | null;
  unlimited?: boolean;
  defaultMode?: Mode;
  preferredTier?: Tier;
} = {}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState<string>("");
  const [streamed, setStreamed] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [outOfCredits, setOutOfCredits] = useState(false);
  const [needsSignup, setNeedsSignup] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(credits);
  const [tab, setTab] = useState<"single" | "bulk">("single");
  const [bulkSeed, setBulkSeed] = useState<File[] | null>(null);
  const [lastUsedTier, setLastUsedTier] = useState<Tier>(preferredTier);
  const bulkAllowed = signedIn;
  const inputRef = useRef<HTMLInputElement>(null);

  // Rotating example carousel for the right pane when no image is uploaded
  const [exampleIdx, setExampleIdx] = useState(0);
  useEffect(() => {
    if (file) return;
    const t = setInterval(() => setExampleIdx((i) => (i + 1) % EXAMPLES.length), 4200);
    return () => clearInterval(t);
  }, [file]);

  // Typewriter effect when prompt arrives
  useEffect(() => {
    if (!prompt) {
      setStreamed("");
      return;
    }
    setStreamed("");
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setStreamed(prompt.slice(0, i));
      if (i >= prompt.length) clearInterval(id);
    }, 14);
    return () => clearInterval(id);
  }, [prompt]);

  const handleFile = useCallback((f: File | null | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (f.size > 30 * 1024 * 1024) {
      setError("Image is too large. Maximum 30 MB.");
      return;
    }
    setError(null);
    setPrompt("");
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  // If multiple images come in at once (drop / multi-select) and the user is
  // eligible for bulk, jump straight into bulk mode and seed the queue.
  const handleFiles = useCallback(
    (incoming: FileList | File[] | null | undefined) => {
      if (!incoming) return;
      const all = Array.from(incoming);
      const images = all.filter((f) => f.type.startsWith("image/"));
      if (images.length === 0) {
        handleFile(all[0]);
        return;
      }
      if (images.length > 1 && bulkAllowed) {
        setError(null);
        setPrompt("");
        setFile(null);
        setPreview(null);
        setBulkSeed(images);
        setTab("bulk");
        return;
      }
      handleFile(images[0]);
    },
    [bulkAllowed, handleFile]
  );

  // Paste support (Ctrl+V)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of Array.from(items)) {
        if (it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) {
            handleFile(f);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFile]);

  const generate = async (tierOverride?: Tier) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setOutOfCredits(false);
    setNeedsSignup(false);
    setPrompt("");
    const activeTier = tierOverride ?? preferredTier;
    try {
      // 0. Downscale to a JPEG ≤ 1280px on the long edge so the LLaVA
      //    request stays well under Cloudflare's ~5 MB payload limit.
      //    LLaVA's vision encoder runs at 336×336 internally, so 1280
      //    is more than enough fidelity.
      const compressed = await compressImage(file, 1280, 0.85);

      // 1. Ask the server for a signed upload URL.
      const urlRes = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ext: "jpg" }),
      });
      const urlData = await urlRes.json();
      if (urlData?.code === "needs_signup") {
        setNeedsSignup(true);
        throw new Error(urlData?.error || "Sign up to keep generating.");
      }
      if (urlRes.status === 401) {
        router.push("/login?next=/image-to-prompt");
        return;
      }
      if (!urlRes.ok || !urlData?.path || !urlData?.token) {
        throw new Error(urlData?.error || "Could not start upload.");
      }

      // 2. Upload the compressed bytes directly to Supabase Storage.
      const supabase = createSupabaseBrowserClient();
      const { error: upErr } = await supabase.storage
        .from("prompt-images")
        .uploadToSignedUrl(urlData.path, urlData.token, compressed, {
          contentType: "image/jpeg",
          upsert: false,
        });
      if (upErr) throw new Error(upErr.message || "Upload failed.");

      // 3. Ask the server to generate the prompt from that uploaded image.
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePath: urlData.path, mode, tier: activeTier }),
      });
      const data = await res.json();
      if (data?.code === "needs_signup") {
        setNeedsSignup(true);
        throw new Error(data?.error || "Sign up to keep generating.");
      }
      if (res.status === 401) {
        router.push("/login?next=/image-to-prompt");
        return;
      }
      if (res.status === 402 || data?.code === "out_of_credits") {
        setOutOfCredits(true);
        throw new Error(data?.error || "You're out of credits.");
      }
      if (!res.ok) throw new Error(data?.error || "Generation failed");
      setPrompt(data.prompt as string);
      setLastUsedTier(activeTier);
      if (typeof data.creditsRemaining === "number") {
        setCreditsRemaining(data.creditsRemaining);
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setPrompt("");
    setStreamed("");
    setError(null);
  };

  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-10 sm:pt-16 pb-20">
      <div className="text-center mb-10 sm:mb-14">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-balance leading-[1.02]">
          <span className="relative z-10">Turn any image into</span>{" "}
          <span className="relative inline-block -rotate-1 px-3">
            <span className="absolute inset-0 bg-accent-lilac/60 backdrop-blur-md rounded-2xl -z-20" aria-hidden />
            <span className="relative z-10">a perfect</span>
          </span>{" "}
          <span className="relative inline-block rotate-1 px-3">
            <span className="absolute inset-0 bg-accent-lime/60 backdrop-blur-md rounded-2xl -z-20" aria-hidden />
            <span className="relative z-10">prompt</span>
          </span>
        </h1>
        <p className="mt-5 text-ink/60 max-w-2xl mx-auto text-balance">
          Drop, paste, or upload any picture. Get a detailed, ready-to-use prompt you can feed
          straight back into your favorite AI image generator.
        </p>
      </div>

      {signedIn && (
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap rounded-2xl border border-black/5 bg-white px-4 py-2.5 text-sm">
          <div className="text-ink/70">
            {unlimited ? (
              <>
                Plan: <strong className="text-ink">Unlimited</strong> this month
              </>
            ) : (
              <>
                Credits left this month:{" "}
                <strong className="text-ink">{creditsRemaining ?? 0}</strong>
              </>
            )}
          </div>
          <Link href="/pricing" className="text-ink underline-offset-2 hover:underline text-xs font-semibold">
            Buy more →
          </Link>
        </div>
      )}

      {tab === "bulk" ? (
        <BulkUploader
          creditsRemaining={creditsRemaining}
          unlimited={unlimited}
          onCreditsChanged={setCreditsRemaining}
          initialFiles={bulkSeed}
          onBackToSingle={() => {
            setBulkSeed(null);
            setTab("single");
          }}
        />
      ) : (
      <div className="grid lg:grid-cols-2 gap-5">
        {/* LEFT — DROP ZONE */}
        <div className="bg-white rounded-3xl border border-black/5 shadow-[0_1px_0_rgba(0,0,0,0.03),0_20px_40px_-20px_rgba(0,0,0,0.08)] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink/80">1. Add an image</h2>
            {file && (
              <button onClick={reset} className="text-xs text-ink/50 hover:text-ink underline-offset-2 hover:underline">
                Clear
              </button>
            )}
          </div>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`relative block rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
              ${dragging ? "border-ink bg-accent-lilac/30" : "border-black/10 hover:border-ink/30 bg-paper"}
              ${preview ? "aspect-[4/3]" : "aspect-[4/3]"}
            `}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple={bulkAllowed}
              className="sr-only"
              onChange={(e) => {
                handleFiles(e.target.files);
                if (inputRef.current) inputRef.current.value = "";
              }}
            />
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-ink text-paper flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-ink">Drop an image here</div>
                  <div className="text-sm text-ink/55 mt-1">
                    or <span className="underline">click to upload</span> · paste with{" "}
                    <kbd className="px-1.5 py-0.5 rounded bg-ink/5 border border-black/10 text-xs">Ctrl</kbd>{" "}
                    +{" "}
                    <kbd className="px-1.5 py-0.5 rounded bg-ink/5 border border-black/10 text-xs">V</kbd>
                  </div>
                </div>
                <div className="text-xs text-ink/40">JPG, PNG, WEBP · up to 30 MB</div>
              </div>
            )}
          </label>

          {/* AI model picker */}
          <div className="mt-5">
            <label className="text-xs font-semibold text-ink/60 mb-2 block" htmlFor="ai-model">
              Select AI Model
            </label>
            <div className="relative">
              <select
                id="ai-model"
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
                className="w-full appearance-none px-4 py-3 pr-10 rounded-2xl bg-paper border border-black/10 text-[15px] font-medium text-ink focus:border-ink focus:outline-none cursor-pointer"
              >
                {MODE_GROUPS.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.items.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            <p className="text-xs text-ink/45 mt-2">{MODE_HINTS[mode]}</p>
          </div>

          {/* CTA */}
          <button
            onClick={() => generate()}
            disabled={!file || loading}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-ink text-paper font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition"
          >
            {loading ? (
              <>
                <Spinner /> Generating prompt…
              </>
            ) : (
              <>
                <Sparkle /> Generate prompt
              </>
            )}
          </button>
          {/* hidden — kept to satisfy onClick type (generate called directly below) */}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {needsSignup && (
            <Link
              href="/login?next=/image-to-prompt"
              className="mt-3 inline-flex items-center px-4 py-2 rounded-full bg-accent-lime text-ink text-sm font-semibold hover:opacity-90"
            >
              Sign up — 2 more free tries →
            </Link>
          )}
          {outOfCredits && (
            <Link
              href="/pricing"
              className="mt-3 inline-flex items-center px-4 py-2 rounded-full bg-accent-lime text-ink text-sm font-semibold hover:opacity-90"
            >
              Buy a credit pack →
            </Link>
          )}
        </div>

        {/* RIGHT — OUTPUT / CAROUSEL */}
        <div className="bg-ink text-paper rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-[0_20px_40px_-20px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-paper/70">2. Your prompt</h2>
            {prompt && (
              <button
                onClick={copy}
                className="text-xs text-paper/70 hover:text-paper inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 hover:border-white/30"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>

          {/* Carousel when idle */}
          {!file && !loading && !prompt && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-paper/50">
                  Example {exampleIdx + 1} of {EXAMPLES.length}
                </div>
                <div className="flex gap-1.5">
                  {EXAMPLES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setExampleIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === exampleIdx ? "w-6 bg-paper" : "w-1.5 bg-paper/30"
                      }`}
                      aria-label={`Example ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div className="animate-fadeUp" key={exampleIdx}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={EXAMPLES[exampleIdx].src}
                  alt=""
                  className="w-full aspect-[4/3] rounded-2xl object-cover border border-white/10"
                />
                <p className="mt-5 text-[15px] leading-relaxed text-paper/90">
                  {EXAMPLES[exampleIdx].prompt}
                </p>
              </div>

              <div className="mt-auto pt-6 text-[11px] text-paper/40 border-t border-white/10">
                Upload an image to generate your own prompt →
              </div>
            </div>
          )}

          {/* Loading shimmer */}
          {loading && (
            <div className="space-y-3">
              <div className="h-3 rounded shimmer w-3/4 opacity-20" />
              <div className="h-3 rounded shimmer w-full opacity-20" />
              <div className="h-3 rounded shimmer w-5/6 opacity-20" />
              <div className="h-3 rounded shimmer w-2/3 opacity-20" />
              <p className="mt-7 text-base sm:text-lg font-semibold tracking-tight text-sweep">
                Analyzing your image…
              </p>
            </div>
          )}

          {/* Generated prompt with typewriter */}
          {!loading && prompt && (
            <div>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap caret">{streamed}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={copy}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-accent-lime text-ink text-sm font-semibold hover:opacity-90"
                >
                  {copied ? "Copied ✓" : "Copy prompt"}
                </button>
                <button
                  onClick={() => generate()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 text-paper text-sm hover:bg-white/20 border border-white/10"
                >
                  Regenerate
                </button>
                {signedIn && UPGRADE_TIER[lastUsedTier] && (
                  <button
                    onClick={() => generate(UPGRADE_TIER[lastUsedTier]!)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-accent-lilac/20 text-paper text-sm hover:bg-accent-lilac/30 border border-accent-lilac/30"
                    title={`Use a higher-quality model — costs ${UPGRADE_CREDITS[lastUsedTier]} credits`}
                  >
                    ✦ Better model
                    <span className="text-paper/60 text-xs">+{UPGRADE_CREDITS[lastUsedTier]} creds</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Idle with file selected but no prompt */}
          {!loading && !prompt && file && (
            <div className="text-paper/60 text-sm">
              Press <strong className="text-paper">Generate prompt</strong> to describe your image.
            </div>
          )}
        </div>
      </div>
      )}
    </section>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Sparkle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    </svg>
  );
}

