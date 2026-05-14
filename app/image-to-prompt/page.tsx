import { Header } from "@/components/Header";
import { PromptStudio } from "@/components/PromptStudio";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { Testimonials } from "@/components/Testimonials";
import { HowToUse } from "@/components/HowToUse";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { currentBillingMonth } from "@/lib/plans";

export const metadata = {
  title: "Free Image to Prompt Generator — AI Tool",
  description:
    "Upload any image and get an accurate AI prompt in seconds. Works with Midjourney, DALL-E, Stable Diffusion, and Flux. Free to try — no account needed.",
  openGraph: {
    title: "Free Image to Prompt Generator",
    description:
      "Upload any image and get an accurate AI prompt in seconds. Works with Midjourney, DALL-E, Stable Diffusion, and Flux.",
    url: "https://imageprompting.org/image-to-prompt",
  },
  alternates: { canonical: "https://imageprompting.org/image-to-prompt" },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let credits: number | null = null;
  let unlimited = false;
  if (user) {
    const service = createSupabaseServiceClient();
    const { data } = await service
      .from("credit_balances")
      .select("credits_remaining, unlimited")
      .eq("user_id", user.id)
      .eq("billing_month", currentBillingMonth())
      .maybeSingle();
    credits = data?.credits_remaining ?? 0;
    unlimited = !!data?.unlimited;
  }

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "imageprompting.org — Image to Prompt",
    url: "https://imageprompting.org/image-to-prompt",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    description:
      "Upload any image and get an accurate AI prompt in seconds. Works with Midjourney, DALL-E, Stable Diffusion, and Flux.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "124" },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "Is it free?", acceptedAnswer: { "@type": "Answer", text: "Yes — generating prompts from images is free to try. You get 2 free generations after signing up, and paid plans start from $7/month." } },
      { "@type": "Question", name: "What image formats are supported?", acceptedAnswer: { "@type": "Answer", text: "JPG, PNG, and WEBP. Most screenshots, photos, and exported renders work out of the box." } },
      { "@type": "Question", name: "Which prompt style should I pick?", acceptedAnswer: { "@type": "Answer", text: "Use General if you just want a clear description. Use Midjourney, Flux, or Stable Diffusion when you plan to paste the prompt straight into one of those tools — the phrasing is tuned for each." } },
      { "@type": "Question", name: "Do you store my uploaded images?", acceptedAnswer: { "@type": "Answer", text: "No. Images are sent to our inference provider, used to generate the prompt, and discarded. We do not keep a copy." } },
      { "@type": "Question", name: "Will the prompt recreate the image exactly?", acceptedAnswer: { "@type": "Answer", text: "No prompt can guarantee a 1:1 recreation — image models are probabilistic. The output is a strong starting point that captures subject, mood, and style." } },
      { "@type": "Question", name: "Can I use the generated prompts commercially?", acceptedAnswer: { "@type": "Answer", text: "Yes. Prompts produced by the tool are yours to use however you like — including for commercial work." } },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Header />
      <PromptStudio signedIn={!!user} credits={credits} unlimited={unlimited} />
      <Features />
      <HowItWorks />
      <Testimonials />
      <HowToUse />
      <FAQ />
      <Footer />
    </main>
  );
}
