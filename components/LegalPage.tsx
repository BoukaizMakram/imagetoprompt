import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main>
      <Header />
      <article className="max-w-3xl mx-auto px-5 sm:px-8 py-20">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{title}</h1>
        <div className="prose prose-neutral mt-8 text-ink/75 leading-relaxed space-y-5 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_h2]:mt-8">
          {children}
        </div>
      </article>
      <Footer />
    </main>
  );
}
