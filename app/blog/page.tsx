import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Blog — Image to Prompt Guides & Tutorials",
  description:
    "Guides on using image-to-prompt for Midjourney, Stable Diffusion, DALL-E, and Flux. Learn reverse prompt engineering, prompt techniques, and more.",
  alternates: { canonical: "https://imageprompting.org/blog" },
};

const posts = [
  {
    slug: "how-to-get-prompt-from-ai-image",
    title: "How to Get a Prompt from Any AI-Generated Image",
    date: "2025-05-10",
    excerpt:
      "Reverse-engineering a prompt from a finished image is one of the most useful skills in AI art. Here's how to do it reliably.",
  },
  {
    slug: "best-image-to-prompt-tools-2025",
    title: "Best Image to Prompt Tools in 2025 (Ranked)",
    date: "2025-05-08",
    excerpt:
      "A comparison of the top tools for extracting prompts from images — tested across accuracy, supported models, and ease of use.",
  },
  {
    slug: "how-to-recreate-midjourney-image",
    title: "How to Recreate a Midjourney Image Using Prompts",
    date: "2025-05-05",
    excerpt:
      "Found a Midjourney image you love but don't have the original prompt? This guide walks through getting close — fast.",
  },
];

export default function BlogPage() {
  return (
    <main>
      <Header />
      <section className="max-w-3xl mx-auto px-5 sm:px-8 pt-16 pb-24">
        <h1 className="text-5xl font-extrabold tracking-tight">Blog</h1>
        <p className="text-ink/60 mt-3 text-[15px]">
          Guides and tutorials for getting the most out of image-to-prompt.
        </p>

        <ul className="mt-12 space-y-8">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="group block">
                <div className="text-xs text-ink/40 mb-1">{post.date}</div>
                <h2 className="text-xl font-bold tracking-tight group-hover:underline underline-offset-2">
                  {post.title}
                </h2>
                <p className="mt-2 text-[15px] text-ink/65 leading-relaxed">{post.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <Footer />
    </main>
  );
}
