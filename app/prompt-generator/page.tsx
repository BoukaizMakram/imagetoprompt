import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata = { title: "AI Prompt Generator" };

export default function Page() {
  return (
    <main>
      <Header />
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-24">
        <h1 className="text-5xl font-extrabold tracking-tight">AI Prompt Generator</h1>
        <p className="text-ink/60 mt-4 max-w-xl">
          Coming soon — generate richer, more controllable prompts from a short idea.
        </p>
        <a
          href="/"
          className="inline-flex items-center mt-8 px-4 py-2 rounded-full bg-ink text-paper text-sm font-medium"
        >
          ← Back to Image to Prompt
        </a>
      </section>
      <Footer />
    </main>
  );
}
