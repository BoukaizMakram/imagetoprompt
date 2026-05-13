"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Is it free?",
    a: "Yes — generating prompts from images is free to try. Heavy usage may require an account in the future, but for now go wild.",
  },
  {
    q: "What image formats are supported?",
    a: "JPG, PNG, and WEBP up to 8 MB. Most screenshots, photos, and exported renders work out of the box.",
  },
  {
    q: "Which prompt style should I pick?",
    a: "Use General if you just want a clear description. Use Midjourney, Flux, or Stable Diffusion when you plan to paste the prompt straight into one of those tools — the phrasing is tuned for each.",
  },
  {
    q: "Do you store my uploaded images?",
    a: "No. Images are sent to our inference provider, used to generate the prompt, and discarded. We do not keep a copy.",
  },
  {
    q: "Can I use the generated prompts commercially?",
    a: "Yes. Prompts produced by the tool are yours to use however you like — including for commercial work.",
  },
  {
    q: "What content is NOT allowed?",
    a: "This tool is for clean, respectful creative work. NSFW, sexual, pornographic, nude or sexually suggestive content is strictly not allowed. Anything haram — including violence, gore, hate, harassment, content depicting minors inappropriately, or anything illegal — is also prohibited. Uploads that violate these rules will be rejected and abuse may result in a permanent block.",
  },
  {
    q: "Will the prompt recreate the image exactly?",
    a: "No prompt can guarantee a 1:1 recreation — image models are probabilistic. The output is a strong starting point that captures subject, mood, and style, and you can iterate from there.",
  },
  {
    q: "Does it work on screenshots and UI mockups?",
    a: "Yes, but it shines on photographs, illustrations, and concept art. UI screenshots will be described but the prompt may not be useful for image generators.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="max-w-3xl mx-auto px-5 sm:px-8 py-20">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Frequently asked questions
        </h2>
        <p className="text-ink/55 mt-3">Everything you need to know before you start.</p>
      </div>

      <div className="space-y-3">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div
              key={f.q}
              className="bg-white border border-black/5 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between text-left px-5 sm:px-6 py-4 hover:bg-ink/[0.02] transition"
                aria-expanded={isOpen}
              >
                <span className="font-semibold text-ink pr-4">{f.q}</span>
                <span
                  className={`flex-shrink-0 w-7 h-7 rounded-full bg-ink text-paper inline-flex items-center justify-center transition-transform ${
                    isOpen ? "rotate-45" : ""
                  }`}
                  aria-hidden
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
              {isOpen && (
                <div className="px-5 sm:px-6 pb-5 -mt-1 text-ink/70 text-[15px] leading-relaxed animate-fadeUp">
                  {f.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
