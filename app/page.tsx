import { Suspense } from "react";
import { Header } from "@/components/Header";
import { PromptStudio } from "@/components/PromptStudio";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { Testimonials } from "@/components/Testimonials";
import { HowToUse } from "@/components/HowToUse";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { hasAuthCookieFromHeaders } from "@/lib/supabase/hasAuthCookie";
import { currentBillingMonth } from "@/lib/plans";

export const metadata = {
  title: "Image to Prompt Generator — Free AI Tool | imageprompting.org",
  description:
    "Turn any image into a detailed AI prompt instantly. Free to try. Works with Midjourney, DALL-E, Stable Diffusion, and Flux.",
  alternates: { canonical: "https://imageprompting.org" },
  openGraph: {
    title: "Image to Prompt Generator — Free AI Tool",
    description: "Turn any image into a detailed AI prompt instantly. Free to try.",
    url: "https://imageprompting.org",
  },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let credits: number | null = null;
  let unlimited = false;
  let preferredTier: "standard" | "enhanced" | "premium" = "standard";
  let user: { id: string } | null = null;

  if (hasAuthCookieFromHeaders()) {
    const supabase = createSupabaseServerClient();
    const {
      data: { user: authedUser },
    } = await supabase.auth.getUser();
    user = authedUser;
  }

  if (user) {
    const service = createSupabaseServiceClient();
    const [{ data: balance }, { data: profile }] = await Promise.all([
      service
        .from("credit_balances")
        .select("credits_remaining, unlimited")
        .eq("user_id", user.id)
        .eq("billing_month", currentBillingMonth())
        .maybeSingle(),
      service
        .from("profiles")
        .select("preferred_model")
        .eq("id", user.id)
        .maybeSingle(),
    ]);
    credits = balance?.credits_remaining ?? 0;
    unlimited = !!balance?.unlimited;
    if (profile?.preferred_model && ["standard", "enhanced", "premium"].includes(profile.preferred_model)) {
      preferredTier = profile.preferred_model as typeof preferredTier;
    }
  }

  return (
    <main>
      <Header />
      <Suspense>
        <PromptStudio signedIn={!!user} credits={credits} unlimited={unlimited} preferredTier={preferredTier} />
      </Suspense>
      <Features />
      <HowItWorks />
      <Testimonials />
      <HowToUse />
      <FAQ />
      <Footer />
    </main>
  );
}
