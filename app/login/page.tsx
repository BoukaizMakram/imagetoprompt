import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LoginForm } from "@/components/LoginForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    redirect(searchParams.next || "/image-to-prompt");
  }

  return (
    <main>
      <Header />
      <section className="max-w-md mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <h1 className="text-4xl font-extrabold tracking-tight text-center">Sign in</h1>
        <p className="mt-3 text-center text-ink/60">
          Use Google or your email — no verification needed.
        </p>
        <div className="mt-8 bg-white rounded-3xl border border-black/5 shadow-[0_1px_0_rgba(0,0,0,0.03),0_20px_40px_-20px_rgba(0,0,0,0.08)] p-6 sm:p-8">
          <LoginForm next={searchParams.next} initialError={searchParams.error} />
        </div>
      </section>
      <Footer />
    </main>
  );
}
