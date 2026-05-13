const steps = [
  { n: "01", t: "Add your image", d: "Drag, drop, paste with Ctrl+V, or click to upload — JPG, PNG, or WEBP." },
  { n: "02", t: "Pick a style", d: "Choose general, Midjourney, Flux, or Stable Diffusion to match your generator." },
  { n: "03", t: "Generate & copy", d: "We caption your image and hand you a clean, ready-to-paste prompt." },
];

export function HowItWorks() {
  return (
    <section className="bg-ink text-paper py-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">How it works</h2>
          <p className="text-paper/50 max-w-md">
            Three steps from any picture to a prompt you can run today.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {steps.map((s) => (
            <div key={s.n} className="border border-white/10 rounded-3xl p-6">
              <div className="text-paper/40 text-sm font-mono">{s.n}</div>
              <h3 className="mt-6 text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-paper/60 text-sm leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
