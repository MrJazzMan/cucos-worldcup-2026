import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/grupos`, changeFrequency: "daily", priority: 0.8 },
    {
      url: `${base}/fasefinal`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    { url: `${base}/privacidade`, changeFrequency: "monthly", priority: 0.3 },
  ];
  return entries;
}
