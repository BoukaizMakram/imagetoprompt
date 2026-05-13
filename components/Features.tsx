const items = [
  {
    title: "Pixel-accurate captions",
    body: "Our vision model reads your image like a senior art director — colors, composition, mood, materials.",
    bg: "bg-accent-lilac",
  },
  {
    title: "Multiple prompt styles",
    body: "Get output tuned for Midjourney, Flux, or Stable Diffusion — or natural language for any model.",
    bg: "bg-accent-lime",
  },
  {
    title: "Paste, drop, upload",
    body: "Ctrl+V anywhere on the page, drag a file in, or browse — whichever fits your flow.",
    bg: "bg-accent-peach",
  },
  {
    title: "Private by default",
    body: "Images are processed for inference and never stored. No accounts required to try.",
    bg: "bg-accent-sky",
  },
];

export function Features() {
  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
      <div className="max-w-2xl">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Designed for creators who move fast.
        </h2>
        <p className="text-ink/55 mt-3">
          Skip the writer&apos;s block. Drop a reference, get a prompt, iterate on what you actually
          want to make.
        </p>
      </div>
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((it) => (
          <div key={it.title} className={`${it.bg} rounded-3xl p-6 aspect-[5/6] flex flex-col justify-between`}>
            <div className="text-xs font-semibold text-ink/60">FEATURE</div>
            <div>
              <h3 className="text-xl font-bold leading-tight">{it.title}</h3>
              <p className="text-sm text-ink/70 mt-2">{it.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
