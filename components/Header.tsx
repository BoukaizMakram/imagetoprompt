import Link from "next/link";
import { Logo } from "./Logo";
import { HeaderNav } from "./HeaderNav";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const nav = [
  { label: "Image to Prompt", href: "/image-to-prompt" },
  { label: "Prompt Generator", href: "/prompt-generator" },
  { label: "AI Describe", href: "/describe" },
  { label: "Pricing", href: "/pricing" },
  { label: "Tutorials", href: "/tutorials" },
];

export async function Header() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-paper/70 border-b border-black/5">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/image-to-prompt" className="flex items-center">
            <Logo />
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-ink/70">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-ink transition-colors">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/account"
              className="hidden sm:inline-flex text-sm text-ink/70 hover:text-ink"
            >
              Account
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex text-sm text-ink/70 hover:text-ink"
            >
              Sign in
            </Link>
          )}
          <Link
            href={user ? "/image-to-prompt" : "/login?next=/image-to-prompt"}
            className="inline-flex items-center px-4 py-2 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90"
          >
            {user ? "Generate" : "Try free"}
          </Link>
          <HeaderNav nav={nav} signedIn={!!user} />
        </div>
      </div>
    </header>
  );
}
