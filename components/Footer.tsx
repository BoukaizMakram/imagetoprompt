import Link from "next/link";
import { Logo } from "./Logo";

const columns = [
  {
    title: "Tools",
    links: [
      { label: "Image to Prompt", href: "/image-to-prompt" },
      { label: "Midjourney Prompt", href: "/image-to-prompt/midjourney" },
      { label: "Stable Diffusion Prompt", href: "/image-to-prompt/stable-diffusion" },
      { label: "Flux Prompt", href: "/image-to-prompt/flux" },
      { label: "ChatGPT Images Prompt", href: "/image-to-prompt/dalle" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Tutorials", href: "/tutorials" },
      { label: "Pricing", href: "/pricing" },
      { label: "Contact Us", href: "/contact" },
      { label: "About Us", href: "/about" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms and conditions", href: "/terms" },
      { label: "Refund policy", href: "/refund" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-black/5 mt-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14">
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 md:gap-12">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-ink/55 max-w-xs">
              Turn any image into a clean, ready-to-use prompt for your favorite AI image generator.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-bold text-ink mb-4">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-ink/65 hover:text-ink transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-black/5 text-xs text-ink/45">
          © {new Date().getFullYear()} Enprico, LLC. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
