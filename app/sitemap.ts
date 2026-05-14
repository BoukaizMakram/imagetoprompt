import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://imageprompting.org";
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/image-to-prompt`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/image-to-prompt/midjourney`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/image-to-prompt/stable-diffusion`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/image-to-prompt/dalle`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/image-to-prompt/flux`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/blog/how-to-get-prompt-from-ai-image`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/blog/best-image-to-prompt-tools-2025`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/blog/how-to-recreate-midjourney-image`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/tutorials`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/refund`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
