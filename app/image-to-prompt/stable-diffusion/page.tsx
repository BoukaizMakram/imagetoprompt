import { Header } from "@/components/Header";
import { PromptStudio } from "@/components/PromptStudio";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { currentBillingMonth } from "@/lib/plans";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Stable Diffusion Prompt Generator from Image — Free AI Tool",
  description:
    "Extract a Stable Diffusion prompt from any image. Upload a reference and get a detailed txt2img prompt — subject, style, quality tags — ready to paste into AUTOMATIC1111 or ComfyUI.",
  alternates: { canonical: "https://imageprompting.org/image-to-prompt/stable-diffusion" },
  openGraph: {
    title: "Stable Diffusion Prompt Generator from Image",
    description: "Extract a Stable Diffusion prompt from any image. Ready to paste into AUTOMATIC1111 or ComfyUI.",
    url: "https://imageprompting.org/image-to-prompt/stable-diffusion",
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
    name: "Stable Diffusion Prompt Generator from Image",
    url: "https://imageprompting.org/image-to-prompt/stable-diffusion",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    description: "Extract a Stable Diffusion prompt from any image.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Header />

      <section className="max-w-3xl mx-auto px-5 sm:px-8 pt-16 pb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink/40 mb-3">Stable Diffusion</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Generate a Stable Diffusion prompt<br className="hidden sm:block" /> from any image
        </h1>
        <p className="mt-4 text-ink/60 max-w-xl mx-auto text-[15px] leading-relaxed">
          Upload a reference image and get a complete Stable Diffusion prompt — with subject,
          artistic style, quality boosters, and negative-prompt suggestions — ready to paste into
          AUTOMATIC1111, ComfyUI, or Forge.
        </p>
      </section>

      <PromptStudio signedIn={!!user} credits={credits} unlimited={unlimited} defaultMode="stable-diffusion" />

      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
          Stable Diffusion prompts need more structure
        </h2>
        <div className="prose prose-ink max-w-none text-[15px] leading-relaxed text-ink/75 space-y-4">
          <p>
            Unlike Midjourney, Stable Diffusion models are sensitive to prompt token order and
            respond well to booster tags like <em>"masterpiece, best quality, highly detailed"</em>.
            Writing an effective SD prompt from scratch requires knowing which tokens carry weight
            for the checkpoint you&apos;re running.
          </p>
          <p>
            Our tool formats the output specifically for Stable Diffusion: positive prompt terms
            are listed in order of visual importance, and common quality boosters are included where
            appropriate. You get a ready-to-run prompt without needing to hand-craft the tag list.
          </p>
          <p>
            Works with SDXL, SD 1.5, and most popular fine-tunes. Paste the positive prompt into
            your interface, add your preferred negative prompt, and iterate.
          </p>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-12 mb-6">
          How to use it
        </h2>
        <ol className="space-y-3 text-[15px] leading-relaxed text-ink/75 list-decimal list-inside">
          <li>Upload your reference image above.</li>
          <li>Select the <strong>Stable Diffusion</strong> style.</li>
          <li>Click <strong>Generate prompt</strong> and copy the result.</li>
          <li>Paste into the positive prompt field in AUTOMATIC1111, ComfyUI, or Forge.</li>
          <li>Add your negative prompt and adjust CFG scale as usual.</li>
        </ol>
      </section>

      <FAQ />
      <Footer />
    </main>
  );
}
