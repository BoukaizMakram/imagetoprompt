import { Header } from "@/components/Header";
import { PromptStudio } from "@/components/PromptStudio";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { currentBillingMonth } from "@/lib/plans";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "DALL-E Prompt Generator from Image — Free AI Tool",
  description:
    "Turn any image into a DALL-E 3 prompt. Upload a reference and get a natural-language description optimized for OpenAI's image generation model.",
  alternates: { canonical: "https://imageprompting.org/image-to-prompt/dalle" },
  openGraph: {
    title: "DALL-E Prompt Generator from Image",
    description: "Turn any image into a DALL-E 3 prompt. Natural-language descriptions optimized for OpenAI's image model.",
    url: "https://imageprompting.org/image-to-prompt/dalle",
  },
};

export default async function Page() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "DALL-E Prompt Generator from Image",
    url: "https://imageprompting.org/image-to-prompt/dalle",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    description: "Turn any image into a DALL-E 3 prompt.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Header />

      <section className="max-w-3xl mx-auto px-5 sm:px-8 pt-16 pb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink/40 mb-3">DALL-E 3</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Generate a DALL-E prompt<br className="hidden sm:block" /> from any image
        </h1>
        <p className="mt-4 text-ink/60 max-w-xl mx-auto text-[15px] leading-relaxed">
          Upload a reference image and get a natural-language description tuned for DALL-E 3.
          DALL-E responds best to clear, descriptive prose — our AI writes exactly that.
        </p>
      </section>

      <PromptStudio signedIn={!!user} credits={credits} unlimited={unlimited} defaultMode="general" />

      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
          DALL-E 3 works differently from other image models
        </h2>
        <div className="prose prose-ink max-w-none text-[15px] leading-relaxed text-ink/75 space-y-4">
          <p>
            DALL-E 3 (used in ChatGPT and the OpenAI API) doesn&apos;t respond well to keyword
            lists or Midjourney-style parameter tags. It performs best with full natural-language
            descriptions — sentences that describe the scene, composition, style, and mood in
            plain English.
          </p>
          <p>
            Our tool formats the output as coherent prose: a clear visual description of your
            reference image that you can paste directly into the DALL-E prompt field or the
            ChatGPT image generation interface. No need to convert keyword lists into sentences
            manually.
          </p>
          <p>
            Works with DALL-E 3 via ChatGPT, the OpenAI API, or any platform that exposes it
            (Bing Image Creator, Microsoft Copilot).
          </p>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-12 mb-6">
          How to use it
        </h2>
        <ol className="space-y-3 text-[15px] leading-relaxed text-ink/75 list-decimal list-inside">
          <li>Upload your reference image above.</li>
          <li>Leave the style on <strong>General</strong> for clean prose output.</li>
          <li>Click <strong>Generate prompt</strong> and copy the result.</li>
          <li>Paste into ChatGPT, the OpenAI API playground, or Bing Image Creator.</li>
        </ol>
      </section>

      <FAQ />
      <Footer />
    </main>
  );
}
