"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Mode = "general" | "flux" | "midjourney" | "stable-diffusion";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "general", label: "General", hint: "Balanced, natural-language description." },
  { id: "flux", label: "Flux", hint: "Cinematic, structured for Flux models." },
  { id: "midjourney", label: "Midjourney", hint: "Stylized phrasing with --ar hints." },
  { id: "stable-diffusion", label: "Stable Diffusion", hint: "Tag-heavy, comma-separated." },
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

export function PromptStudio() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [mode, setMode] = useState<Mode>("general");
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState<string>("");
  const [streamed, setStreamed] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
    if (f.size > 8 * 1024 * 1024) {
      setError("Image is too large. Maximum 8 MB.");
      return;
    }
    setError(null);
    setPrompt("");
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

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

  const generate = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setPrompt("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("mode", mode);
      const res = await fetch("/api/generate", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generation failed");
      setPrompt(data.prompt as string);
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
          Turn any image into{" "}
          <span className="relative inline-block -rotate-1 px-3">
            <span className="absolute inset-0 bg-accent-lilac/60 backdrop-blur-md rounded-2xl -z-10" aria-hidden />
            <span className="relative">a perfect</span>
          </span>{" "}
          <span className="relative inline-block rotate-1 px-3">
            <span className="absolute inset-0 bg-accent-lime/60 backdrop-blur-md rounded-2xl -z-10" aria-hidden />
            <span className="relative">prompt</span>
          </span>
        </h1>
        <p className="mt-5 text-ink/60 max-w-2xl mx-auto text-balance">
          Drop, paste, or upload any picture. Get a detailed, ready-to-use prompt you can feed
          straight back into your favorite AI image generator.
        </p>
      </div>

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
              handleFile(e.dataTransfer.files?.[0]);
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
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0])}
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
                <div className="text-xs text-ink/40">JPG, PNG, WEBP · up to 8 MB</div>
              </div>
            )}
          </label>

          {/* Mode chips */}
          <div className="mt-5">
            <div className="text-xs font-semibold text-ink/60 mb-2">Prompt style</div>
            <div className="flex flex-wrap gap-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all
                    ${mode === m.id ? "bg-ink text-paper border-ink" : "bg-white text-ink/70 border-black/10 hover:border-ink/30"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-ink/45 mt-2">{MODES.find((m) => m.id === mode)?.hint}</p>
          </div>

          {/* CTA */}
          <button
            onClick={generate}
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
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
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
              <p className="text-xs text-paper/50 mt-6">Analyzing your image…</p>
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
                  onClick={generate}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 text-paper text-sm hover:bg-white/20 border border-white/10"
                >
                  Regenerate
                </button>
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
