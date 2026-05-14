import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata = { title: "AI Describe Image" };

export default function Page() {
  return (
    <main>
      <Header />
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-24">
        <h1 className="text-5xl font-extrabold tracking-tight">AI Describe Image</h1>
        <p className="text-ink/60 mt-4 max-w-xl">
          Need a plain-English description of an image instead of a generator prompt? This page is on
          the way.
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
