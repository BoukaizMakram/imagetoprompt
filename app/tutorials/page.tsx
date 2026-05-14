import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Tutorials — Image to Prompt Guides",
  description:
    "Step-by-step guides on using image-to-prompt for Midjourney, Stable Diffusion, and DALL-E. Learn how to get accurate prompts from any reference image.",
};

export default function Page() {
  return (
    <main>
      <Header />
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-24">
        <h1 className="text-5xl font-extrabold tracking-tight">Tutorials</h1>
        <p className="text-ink/60 mt-4 max-w-xl">
          Guides on getting the most out of image-to-prompt, picking the right style, and going from
          reference to final render.
        </p>
        <a
          href="/"
          className="inline-flex items-center mt-8 px-4 py-2 rounded-full bg-ink text-paper text-sm font-medium"
        >
          ← Back home
        </a>
      </section>
      <Footer />
    </main>
  );
}
