import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactForm } from "@/components/ContactForm";

export const metadata = {
  title: "Contact Us",
  description:
    "Have a question, bug report, or feedback about imageprompting.org? Send us a note — we reply within two business days.",
};

export default function Page() {
  return (
    <main>
      <Header />
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-20">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Contact Us</h1>
        <p className="mt-4 text-ink/65 text-[15px] leading-relaxed max-w-xl">
          Question, bug, partnership idea, or feedback? Send us a note — we read every message and
          reply within two business days.
        </p>

        <div className="mt-10">
          <ContactForm />
        </div>
      </section>
      <Footer />
    </main>
  );
}
