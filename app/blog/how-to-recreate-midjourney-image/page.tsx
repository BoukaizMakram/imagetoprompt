import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "How to Recreate a Midjourney Image Using Prompts",
  description:
    "Found a Midjourney image you love but don't have the original prompt? Here's how to reverse-engineer it and get close — quickly.",
  alternates: { canonical: "https://imageprompting.org/blog/how-to-recreate-midjourney-image" },
  openGraph: {
    title: "How to Recreate a Midjourney Image Using Prompts",
    description: "Found a Midjourney image you love but don't have the original prompt? Here's how to get close — fast.",
    url: "https://imageprompting.org/blog/how-to-recreate-midjourney-image",
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

        <div className="text-xs text-ink/40 mb-3">2025-05-05</div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          How to Recreate a Midjourney Image Using Prompts
        </h1>
        <p className="mt-5 text-[16px] text-ink/70 leading-relaxed">
          You're scrolling through a Midjourney showcase and see an image that's exactly the
          aesthetic you've been trying to achieve. The original prompt is nowhere to be found.
          Here's a step-by-step approach that gets you 90% of the way there in under five minutes.
        </p>

        <div className="prose max-w-none mt-10 text-[15px] leading-relaxed text-ink/75 space-y-6">

          <h2 className="text-2xl font-extrabold text-ink mt-10 mb-4">Step 1: Extract a prompt with an image-to-prompt tool</h2>
          <p>
            Save the image and upload it to{" "}
            <Link href="/image-to-prompt/midjourney" className="underline text-ink">
              imageprompting.org/image-to-prompt/midjourney
            </Link>
            . Select the Midjourney mode and generate a prompt. The tool will analyze the subject,
            composition, lighting, and visual style, and return a prompt formatted for Midjourney's
            <code className="bg-ink/5 px-1 rounded font-mono text-sm">/imagine</code> command.
          </p>
          <p>
            This gives you the conceptual foundation of the image in prompt language — the subject
            matter, mood, color palette, and any identifiable art style.
          </p>

          <h2 className="text-2xl font-extrabold text-ink mt-10 mb-4">Step 2: Identify visual attributes manually</h2>
          <p>
            Before running the extracted prompt, look at the source image and note:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Aspect ratio</strong> — portrait, landscape, square? Add <code>--ar 3:2</code> or similar.</li>
            <li><strong>Rendering style</strong> — photorealistic, painterly, 3D render, flat illustration?</li>
            <li><strong>Lighting quality</strong> — golden hour, studio, overcast, neon?</li>
            <li><strong>Color temperature</strong> — warm, cool, desaturated, high contrast?</li>
            <li><strong>Camera feel</strong> — shallow depth of field, wide angle, macro?</li>
          </ul>
          <p>
            Add any of these you can identify as modifiers to the extracted prompt. Many Midjourney
            aesthetics come primarily from lighting and color grading rather than subject matter.
          </p>

          <h2 className="text-2xl font-extrabold text-ink mt-10 mb-4">Step 3: Try Midjourney's built-in /describe</h2>
          <p>
            If you have a Midjourney subscription, run the image through{" "}
            <code className="bg-ink/5 px-1 rounded font-mono text-sm">/describe</code> as well.
            It returns four prompt variations. Compare them to the image-to-prompt output — often
            one of the variations will capture a visual element the other missed, and you can combine
            the best parts.
          </p>

          <h2 className="text-2xl font-extrabold text-ink mt-10 mb-4">Step 4: Use image prompting alongside the text</h2>
          <p>
            Midjourney allows you to combine an image URL with a text prompt using the format:
          </p>
          <pre className="bg-ink/5 rounded-xl p-4 text-sm font-mono overflow-x-auto">
            /imagine [image_url] [text_prompt] --iw 0.5
          </pre>
          <p>
            Upload the source image to Discord to get a URL, then pass it alongside your text
            prompt. The <code>--iw</code> (image weight) parameter controls how strongly the image
            influences the output — start at 0.5 and adjust. This often gets closer to the original
            visual than text alone.
          </p>

          <h2 className="text-2xl font-extrabold text-ink mt-10 mb-4">Step 5: Iterate on --style and --chaos</h2>
          <p>
            If your first result is close but not quite there, two parameters help fast iteration:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong><code>--chaos 10–30</code></strong> — adds variation to each generation. Running
              the same prompt 4 times with <code>--chaos 20</code> gives you more visual range to
              compare.
            </li>
            <li>
              <strong><code>--style raw</code></strong> — reduces Midjourney's default aesthetic
              processing, useful when the source image has a distinctive non-Midjourney look.
            </li>
          </ul>

          <h2 className="text-2xl font-extrabold text-ink mt-10 mb-4">A realistic expectation</h2>
          <p>
            You won't get a pixel-for-pixel match — Midjourney is non-deterministic, and even the
            original creator couldn't reproduce the exact image with the original prompt. What you
            can get is an image that shares the same aesthetic, color language, and subject treatment.
            That's usually exactly what you need when working from a reference.
          </p>
          <p>
            The workflow above gets you there in 3–4 iterations rather than 20. Start with a good
            extracted prompt, add the visual attributes you identify manually, try image prompting
            for the hardest-to-describe elements, and use <code>--chaos</code> to generate range.
          </p>

        </div>

        <div className="mt-14 p-6 rounded-2xl bg-ink text-paper">
          <div className="font-bold text-lg mb-2">Extract a Midjourney prompt now</div>
          <p className="text-paper/70 text-sm mb-4">
            Upload any image and get a Midjourney-formatted prompt in seconds.
          </p>
          <Link
            href="/image-to-prompt/midjourney"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-lime text-ink text-sm font-semibold hover:opacity-90 transition"
          >
            Generate a Midjourney prompt →
          </Link>
        </div>
      </article>
      <Footer />
    </main>
  );
}
