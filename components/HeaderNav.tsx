"use client";

import Link from "next/link";
import { useState } from "react";

export function HeaderNav({
  nav,
  signedIn,
}: {
  nav: { label: string; href: string }[];
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-16 md:hidden border-t border-black/5 bg-paper">
          <div className="px-5 py-3 flex flex-col gap-3">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-sm text-ink/80"
                onClick={() => setOpen(false)}
              >
                {n.label}
              </Link>
            ))}
            <Link
              href={signedIn ? "/account" : "/login"}
              className="text-sm text-ink/80"
              onClick={() => setOpen(false)}
            >
              {signedIn ? "Account" : "Sign in"}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
