import { Header } from "@/components/Header";
import { PromptStudio } from "@/components/PromptStudio";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { currentBillingMonth } from "@/lib/plans";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "GPT Image 2 Prompt Generator from Image — Free AI Tool",
  description:
    "Upload any image and get a GPT Image 2 prompt in seconds. Our AI converts your reference into the natural-language prose that OpenAI's latest image model responds to best.",
  alternates: { canonical: "https://imageprompting.org/image-to-prompt/gpt-image-2" },
  openGraph: {
    title: "GPT Image 2 Prompt Generator from Image",
    description: "Upload any image and get a GPT Image 2 prompt instantly. Free to try.",
    url: "https://imageprompting.org/image-to-prompt/gpt-image-2",
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
    name: "GPT Image 2 Prompt Generator from Image",
    url: "https://imageprompting.org/image-to-prompt/gpt-image-2",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    description: "Upload any image and get a GPT Image 2 prompt in seconds.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Header />

      <section className="max-w-3xl mx-auto px-5 sm:px-8 pt-16 pb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink/40 mb-3">GPT Image 2</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Generate a GPT Image 2 prompt<br className="hidden sm:block" /> from any image
        </h1>
        <p className="mt-4 text-ink/60 max-w-xl mx-auto text-[15px] leading-relaxed">
          Upload a reference image and get a natural-language description tuned for{" "}
          <strong>GPT Image 2</strong> — OpenAI&apos;s most advanced image model. It understands
          precise prose better than any previous model. Our AI writes exactly that.
        </p>
      </section>

      <PromptStudio signedIn={!!user} credits={credits} unlimited={unlimited} defaultMode="gpt-image-2" />

      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
          What makes GPT Image 2 different
        </h2>
        <div className="prose prose-ink max-w-none text-[15px] leading-relaxed text-ink/75 space-y-4">
          <p>
            GPT Image 2 (<code className="font-mono bg-ink/5 px-1 rounded">gpt-image-2</code>) is
            OpenAI&apos;s latest and most capable image generation model, released in April 2026. It
            replaces DALL-E 3 as the default across ChatGPT and the OpenAI API, with major
            improvements in photorealism, prompt adherence, and text rendering.
          </p>
          <p>
            Unlike earlier models, GPT Image 2 has native reasoning capabilities — it thinks through
            the scene before generating, which means it handles complex compositions, spatial
            relationships, and multi-element scenes far more accurately. It also supports{" "}
            <strong>4K resolution output</strong> and renders text in images with character-level
            accuracy, including non-Latin scripts.
          </p>
          <p>
            The model responds best to complete, descriptive natural-language sentences. Our tool
            extracts exactly this from your reference image: a precise prose description covering
            subject, environment, lighting, color palette, style, and composition — formatted for
            how GPT Image 2 processes input.
          </p>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-12 mb-6">
          How to use it
        </h2>
        <ol className="space-y-3 text-[15px] leading-relaxed text-ink/75 list-decimal list-inside">
          <li>Upload your reference image above.</li>
          <li>Make sure <strong>GPT Image 2</strong> is selected as the output mode.</li>
          <li>Click <strong>Generate prompt</strong> and copy the result.</li>
          <li>
            Paste into the{" "}
            <a href="https://platform.openai.com" target="_blank" rel="noopener" className="underline">
              OpenAI API
            </a>
            {" "}using model <code className="font-mono bg-ink/5 px-1 rounded">gpt-image-2</code>,
            or into ChatGPT&apos;s image generation interface.
          </li>
        </ol>
      </section>

      <FAQ />
      <Footer />
    </main>
  );
}
