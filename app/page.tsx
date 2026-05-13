import { Header } from "@/components/Header";
import { PromptStudio } from "@/components/PromptStudio";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { Testimonials } from "@/components/Testimonials";
import { HowToUse } from "@/components/HowToUse";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

export default function Page() {
  return (
    <main>
      <Header />
      <PromptStudio />
      <Features />
      <HowItWorks />
      <Testimonials />
      <HowToUse />
      <FAQ />
      <Footer />
    </main>
  );
}
