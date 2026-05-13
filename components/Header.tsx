"use client";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Logo";

const nav = [
  { label: "Image to Prompt", href: "/" },
  { label: "Prompt Generator", href: "/prompt-generator" },
  { label: "AI Describe", href: "/describe" },
  { label: "Tutorials", href: "/tutorials" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-paper/70 border-b border-black/5">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center">
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
          <Link href="/login" className="hidden sm:inline-flex text-sm text-ink/70 hover:text-ink">
            Sign in
          </Link>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90"
          >
            Try free
          </Link>
          <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-black/5 bg-paper">
          <div className="px-5 py-3 flex flex-col gap-3">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="text-sm text-ink/80" onClick={() => setOpen(false)}>
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
