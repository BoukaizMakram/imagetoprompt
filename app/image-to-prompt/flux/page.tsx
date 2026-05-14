import { Header } from "@/components/Header";
import { PromptStudio } from "@/components/PromptStudio";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { currentBillingMonth } from "@/lib/plans";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Flux Prompt Generator from Image — Free AI Tool",
  description:
    "Upload any image and get a Flux-optimized prompt instantly. Works with Flux.1 Dev, Flux.1 Schnell, and Flux Pro. Free to try.",
  alternates: { canonical: "https://imageprompting.org/image-to-prompt/flux" },
  openGraph: {
    title: "Flux Prompt Generator from Image",
    description: "Upload any image and get a Flux-optimized prompt instantly. Works with Flux.1 Dev, Schnell, and Pro.",
    url: "https://imageprompting.org/image-to-prompt/flux",
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
    name: "Flux Prompt Generator from Image",
    url: "https://imageprompting.org/image-to-prompt/flux",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    description: "Upload any image and get a Flux-optimized prompt instantly.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Header />

      <section className="max-w-3xl mx-auto px-5 sm:px-8 pt-16 pb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink/40 mb-3">Flux</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Generate a Flux prompt<br className="hidden sm:block" /> from any image
        </h1>
        <p className="mt-4 text-ink/60 max-w-xl mx-auto text-[15px] leading-relaxed">
          Upload a reference and get a detailed prompt tuned for Flux.1 Dev, Flux.1 Schnell, and
          Flux Pro. Flux understands natural descriptions — our AI writes them.
        </p>
      </section>

      <PromptStudio signedIn={!!user} credits={credits} unlimited={unlimited} defaultMode="flux" />

      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
          Why Flux needs a different approach
        </h2>
        <div className="prose prose-ink max-w-none text-[15px] leading-relaxed text-ink/75 space-y-4">
          <p>
            Flux models (developed by Black Forest Labs) produce remarkably photorealistic results
            and follow prompts with high fidelity. Unlike earlier diffusion models, Flux handles
            long, descriptive text prompts well — making it ideal for prompts that capture nuanced
            details like texture, reflections, and fine facial features.
          </p>
          <p>
            Our tool formats output for Flux by writing dense but natural descriptions that cover
            subject detail, environment, lighting, and photographic style. The result is a prompt
            that takes full advantage of Flux&apos;s text-following capability without the quality
            tag boilerplate that SD-style prompts require.
          </p>
          <p>
            Works with Flux.1 Dev and Schnell on ComfyUI, Fal.ai, Replicate, and any other platform
            running a Flux checkpoint.
          </p>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-12 mb-6">
          How to use it
        </h2>
        <ol className="space-y-3 text-[15px] leading-relaxed text-ink/75 list-decimal list-inside">
          <li>Upload your reference image above.</li>
          <li>Select the <strong>Flux</strong> style.</li>
          <li>Click <strong>Generate prompt</strong> and copy the result.</li>
          <li>Paste into ComfyUI, Fal.ai, Replicate, or your preferred Flux interface.</li>
        </ol>
      </section>

      <FAQ />
      <Footer />
    </main>
  );
}
