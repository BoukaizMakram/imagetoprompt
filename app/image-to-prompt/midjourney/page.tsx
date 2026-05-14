import { Header } from "@/components/Header";
import { PromptStudio } from "@/components/PromptStudio";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { currentBillingMonth } from "@/lib/plans";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Midjourney Prompt Generator from Image — Free AI Tool",
  description:
    "Upload any image and get a Midjourney-ready prompt in seconds. Our AI reverse-engineers the subject, style, lighting, and mood into a paste-ready /imagine prompt.",
  alternates: { canonical: "https://imageprompting.org/image-to-prompt/midjourney" },
  openGraph: {
    title: "Midjourney Prompt Generator from Image",
    description: "Upload any image and get a Midjourney-ready prompt in seconds.",
    url: "https://imageprompting.org/image-to-prompt/midjourney",
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
    name: "Midjourney Prompt Generator from Image",
    url: "https://imageprompting.org/image-to-prompt/midjourney",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    description: "Upload any image and get a Midjourney-ready prompt in seconds.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Header />

      <section className="max-w-3xl mx-auto px-5 sm:px-8 pt-16 pb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink/40 mb-3">Midjourney</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Get a Midjourney prompt<br className="hidden sm:block" /> from any image
        </h1>
        <p className="mt-4 text-ink/60 max-w-xl mx-auto text-[15px] leading-relaxed">
          Upload a reference photo, illustration, or screenshot. Our AI reads the subject, lighting,
          color palette, and artistic style — then writes a <code className="font-mono bg-ink/5 px-1 rounded">/imagine</code> prompt you can paste
          straight into Midjourney.
        </p>
      </section>

      <PromptStudio signedIn={!!user} credits={credits} unlimited={unlimited} defaultMode="midjourney" />

      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
          Why use an image-to-prompt tool for Midjourney?
        </h2>
        <div className="prose prose-ink max-w-none text-[15px] leading-relaxed text-ink/75 space-y-4">
          <p>
            Midjourney responds best to prompts that describe visuals precisely — camera angle,
            lighting quality, color grading, art style, and mood all affect the output. When you
            already have a reference image that captures what you want, translating it into words
            manually is slow and imprecise.
          </p>
          <p>
            Our tool uses a vision AI to read your image and produce a structured Midjourney prompt
            tuned for the way the model interprets text. Rather than generic adjectives, it produces
            phrases like <em>"soft volumetric rim lighting"</em>, <em>"shot on 85mm f/1.4"</em>, or
            <em>"isometric illustration, flat colors"</em> — the kind of language Midjourney
            actually responds to.
          </p>
          <p>
            The result is a starting prompt you can paste into <code>/imagine</code> and iterate
            from — without spending twenty minutes guessing keywords.
          </p>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-12 mb-6">
          How to use it
        </h2>
        <ol className="space-y-3 text-[15px] leading-relaxed text-ink/75 list-decimal list-inside">
          <li>Upload or paste your reference image above.</li>
          <li>Make sure the <strong>Midjourney</strong> style is selected.</li>
          <li>Click <strong>Generate prompt</strong>.</li>
          <li>Copy the result and paste it into Midjourney&apos;s <code>/imagine</code> command.</li>
          <li>Iterate by adding <code>--ar</code>, <code>--style</code>, and <code>--chaos</code> parameters as needed.</li>
        </ol>
      </section>

      <FAQ />
      <Footer />
    </main>
  );
}
