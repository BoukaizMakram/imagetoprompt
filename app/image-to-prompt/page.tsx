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
  title: "Image to Prompt — imageprompting.org",
  description:
    "Turn any image into a detailed, paste-ready AI prompt. Drop, paste (Ctrl+V), or upload — pick a style and copy the prompt.",
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

  return (
    <main>
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
