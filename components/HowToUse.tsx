const steps = [
  {
    n: "Step 1",
    t: "Open the studio",
    d: "Scroll to the top of this page — the upload zone is on the left, prompt panel on the right.",
  },
  {
    n: "Step 2",
    t: "Add your reference image",
    d: "Drag a file directly onto the dashed box, click to browse, or press Ctrl+V (Cmd+V on Mac) anywhere on the page to paste from clipboard. JPG, PNG, or WEBP up to 8 MB.",
  },
  {
    n: "Step 3",
    t: "Pick a prompt style",
    d: "General gives a natural paragraph. Flux is cinematic. Midjourney is comma-separated with --ar hints. Stable Diffusion outputs tag-style prompts you can paste into Automatic1111 or ComfyUI.",
  },
  {
    n: "Step 4",
    t: "Generate",
    d: "Click Generate prompt. Within a few seconds the right panel will type out a detailed prompt describing the subject, composition, lighting, mood, and style.",
  },
  {
    n: "Step 5",
    t: "Copy & remix",
    d: "Hit Copy, paste it into your image generator, and tweak any words you want to push the result in a different direction.",
  },
];

export function HowToUse() {
  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
      <div className="max-w-2xl mb-10">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          How to use the Image to Prompt generator
        </h2>
        <p className="text-ink/55 mt-3">
          From reference to prompt in under a minute. Here&apos;s the full flow.
        </p>
      </div>

      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li
            key={s.n}
            className="grid md:grid-cols-[180px_1fr] gap-3 md:gap-8 bg-white border border-black/5 rounded-3xl p-6"
          >
            <div>
              <div className="text-xs font-mono text-ink/40">0{i + 1}</div>
              <div className="text-sm font-bold text-ink mt-1">{s.n}</div>
            </div>
            <div>
              <h3 className="text-lg font-bold">{s.t}</h3>
              <p className="text-ink/65 text-[15px] leading-relaxed mt-1.5">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
