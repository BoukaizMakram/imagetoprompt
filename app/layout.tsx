import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://imageprompting.org"),
  title: {
    default: "imageprompting.org — Image to Prompt",
    template: "%s — imageprompting.org",
  },
  description:
    "Turn any image into a detailed AI prompt. Drop, paste, or upload — get a ready-to-use prompt in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
