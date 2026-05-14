import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "How to Get a Prompt from Any AI-Generated Image",
  description:
    "Reverse-engineering a prompt from a finished AI image is one of the most useful skills for creators. Here's how to do it reliably using image-to-prompt tools.",
  alternates: { canonical: "https://imageprompting.org/blog/how-to-get-prompt-from-ai-image" },
  openGraph: {
    title: "How to Get a Prompt from Any AI-Generated Image",
    description: "Reverse-engineering a prompt from a finished AI image. Step-by-step guide.",
    url: "https://imageprompting.org/blog/how-to-get-prompt-from-ai-image",
  },
};

export default function Page() {
  return (
    <main>
      <Header />
      <article className="max-w-2xl mx-auto px-5 sm:px-8 pt-14 pb-24">
        <Link href="/blog" className="text-xs text-ink/40 hover:text-ink transition mb-6 inline-block">
          ← Back to blog
        </Link>

        <div className="text-xs text-ink/40 mb-3">2025-05-10</div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          How to Get a Prompt from Any AI-Generated Image
        </h1>
        <p className="mt-5 text-[16px] text-ink/70 leading-relaxed">
          You found an AI image you love — on Twitter, in a Discord, or in a portfolio. You want
          to recreate something similar, but you don't have the original prompt. This guide walks
          through how to reverse-engineer it.
        </p>

        <div className="prose max-w-none mt-10 text-[15px] leading-relaxed text-ink/75 space-y-6">
          <h2 className="text-2xl font-extrabold text-ink mt-10 mb-4">Why this is hard to do manually</h2>
          <p>
            AI image models don't embed prompts in the image file — unlike EXIF metadata, there's
            no hidden field you can read. The image is a one-way output. Reconstructing the prompt
            from it requires understanding the visual language of the model: what words produce
            what lighting, what phrases trigger specific styles.
          </p>
          <p>
            Doing this manually by staring at an image and guessing keywords is slow and usually
            produces something only vaguely similar. The better approach is to use a vision AI
            that can read the image and translate it into model-specific language automatically.
          </p>

          <h2 className="text-2xl font-extrabold text-ink mt-10 mb-4">Method 1: Use an image-to-prompt tool</h2>
          <p>
            The fastest approach is to upload the image to{" "}
            <Link href="/image-to-prompt" className="underline text-ink">
              imageprompting.org
            </Link>
            , select the target model (Midjourney, Stable Diffusion, Flux, or DALL-E), and generate
            a prompt. The tool analyzes the visual content — subject, composition, lighting, color
            palette, and style — and writes a prompt calibrated to how that specific model
            interprets language.
          </p>
          <p>
            This works best when you select the correct target model. A Midjourney image fed
            through the Stable Diffusion mode will produce a valid SD prompt, but it may miss
            style-specific nuances. When in doubt about which model generated the source image,
            try the General mode — it produces a clean description that most models can use.
          </p>

          <h2 className="text-2xl font-extrabold text-ink mt-10 mb-4">Method 2: Check image metadata (PNG only)</h2>
          <p>
            Some tools embed generation metadata directly into PNG files. If the image was
            downloaded from a platform that preserves metadata (e.g., AUTOMATIC1111 local
            generations, some Stable Diffusion UIs), you can read it with a tool like{" "}
            <code className="bg-ink/5 px-1 rounded font-mono text-sm">exiftool</code> or simply by
            dragging the image into AUTOMATIC1111's PNG Info tab.
          </p>
          <p>
            This won't work for images shared on Twitter/X, Instagram, or most other social
            platforms — they strip metadata on upload. But for images you generated yourself or
            received directly from another creator, it's worth checking first.
          </p>

          <h2 className="text-2xl font-extrabold text-ink mt-10 mb-4">Method 3: Use CLIP Interrogation</h2>
          <p>
            CLIP Interrogation (available in AUTOMATIC1111 via the Interrogate button) uses a
            CLIP vision model to describe an image in terms of booru-style tags commonly used in
            Stable Diffusion prompts. It's useful for SD workflows but produces keyword lists
            rather than coherent descriptions — not ideal for Midjourney or DALL-E.
          </p>

          <h2 className="text-2xl font-extrabold text-ink mt-10 mb-4">Getting the best results</h2>
          <p>
            A few practices that improve output across all methods:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Use the highest resolution version of the source image you can find.</li>
            <li>Crop out watermarks and UI chrome before uploading.</li>
            <li>Generate 2–3 prompts and compare — the best elements often appear across multiple outputs.</li>
            <li>Treat the result as a starting point, not a final answer. Iterate by adding specificity.</li>
          </ul>

          <h2 className="text-2xl font-extrabold text-ink mt-10 mb-4">One limitation to know</h2>
          <p>
            No prompt-extraction tool can recover the exact original prompt — image generation is
            lossy in both directions. Two different prompts can produce visually similar images,
            and the same prompt run twice produces different outputs. What you get from
            reverse-engineering is a prompt that produces something <em>similar</em>, not identical.
            That's usually enough to get you 80% of the way there, and from that starting point
            manual iteration is fast.
          </p>
        </div>

        <div className="mt-14 p-6 rounded-2xl bg-ink text-paper">
          <div className="font-bold text-lg mb-2">Try it now</div>
          <p className="text-paper/70 text-sm mb-4">
            Upload any image and get an AI prompt back in seconds — free, no account needed for
            your first try.
          </p>
          <Link
            href="/image-to-prompt"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-lime text-ink text-sm font-semibold hover:opacity-90 transition"
          >
            Generate a prompt →
          </Link>
        </div>
      </article>
      <Footer />
    </main>
  );
}
