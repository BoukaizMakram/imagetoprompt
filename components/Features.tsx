import Image from "next/image";

const items = [
  {
    title: "Pixel-accurate captions",
    body: "Our vision model reads your image like a senior art director — colors, composition, mood, materials.",
    bg: "bg-accent-lilac",
    image: "/pixel accurate.png",
  },
  {
    title: "Multiple prompt styles",
    body: "Get output tuned for Midjourney, Flux, or Stable Diffusion — or natural language for any model.",
    bg: "bg-accent-lime",
    image: "/multiple models.png",
  },
  {
    title: "Paste, drop, upload",
    body: "Ctrl+V anywhere on the page, drag a file in, or browse — whichever fits your flow.",
    bg: "bg-accent-peach",
    image: "/drag and drop.png",
  },
  {
    title: "Private by default",
    body: "Your images are stored privately to your account so only you can see your history.",
    bg: "bg-accent-sky",
    image: "/private.png",
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
          <div
            key={it.title}
            className={`${it.bg} rounded-3xl p-6 flex flex-col gap-4`}
          >
            <div className="relative flex items-center justify-center h-36 sm:h-40">
              <Image
                src={it.image}
                alt=""
                fill
                sizes="(max-width: 640px) 280px, (max-width: 1024px) 340px, 260px"
                className="object-contain"
              />
            </div>
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
