import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://imageprompting.org"),
  title: {
    default: "Image to Prompt Generator — Free AI Tool | imageprompting.org",
    template: "%s | imageprompting.org",
  },
  description:
    "Drop any image and get a perfect AI prompt in seconds. Boost your creative workflow with model-specific output for Midjourney, Flux, Stable Diffusion, and more — free to try.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  keywords: [
    "image to prompt",
    "image to prompt generator",
    "ai image to prompt",
    "reverse prompt engineering",
    "midjourney prompt from image",
    "stable diffusion prompt extractor",
    "chatgpt images prompt generator from image",
    "flux prompt from image",
  ],
  openGraph: {
    type: "website",
    siteName: "imageprompting.org",
    title: "Image to Prompt Generator — Free AI Tool",
    description:
      "Drop any image and get a perfect AI prompt in seconds. Model-specific output for Midjourney, Flux, Stable Diffusion, and more.",
    url: "https://imageprompting.org",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "imageprompting.org — Image to Prompt" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Image to Prompt Generator — Free AI Tool",
    description: "Turn any image into a detailed AI prompt instantly. Free to try.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  verification: { google: "LfXh5Dp7AIaMNm2vBxlm21_K0UOyuVzdHRlIUH0y7N4" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-5M2M6LYXHF"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-5M2M6LYXHF');`}
        </Script>
      </head>
      <body className={inter.variable} suppressHydrationWarning>{children}</body>
    </html>
  );
}
