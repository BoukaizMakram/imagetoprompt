const reviews = [
  {
    name: "Sara M.",
    role: "Concept artist",
    body:
      "I used to spend an hour just writing prompts. Now I drop a reference, get a starting point in seconds, and tweak from there.",
    bg: "bg-accent-lilac",
  },
  {
    name: "David K.",
    role: "Indie game dev",
    body:
      "The Stable Diffusion style output drops straight into ComfyUI. The tag-quality is honestly better than what I was writing by hand.",
    bg: "bg-accent-lime",
  },
  {
    name: "Yusra A.",
    role: "Brand designer",
    body:
      "Clean, fast, no friction. Paste an image with Ctrl+V and you get a usable prompt — exactly what I needed for moodboards.",
    bg: "bg-accent-peach",
  },
  {
    name: "Marco T.",
    role: "Photographer",
    body:
      "I feed it shots of my own photography to reverse-engineer lighting and lens cues for AI mockups. Genuinely useful tool.",
    bg: "bg-accent-sky",
  },
];

export function Testimonials() {
  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">What our users say</h2>
        <p className="text-ink/55 max-w-md">
          Designers, devs, and photographers using image-to-prompt every day.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reviews.map((r) => (
          <figure
            key={r.name}
            className={`${r.bg} rounded-3xl p-6 flex flex-col justify-between min-h-[220px]`}
          >
            <blockquote className="text-[15px] leading-relaxed text-ink/85">
              &ldquo;{r.body}&rdquo;
            </blockquote>
            <figcaption className="mt-6">
              <div className="font-bold text-ink">{r.name}</div>
              <div className="text-xs text-ink/60">{r.role}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
