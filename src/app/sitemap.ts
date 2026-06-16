import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    { url: base, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/grupos`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/eliminatorias`, changeFrequency: "daily", priority: 0.8 },
  ];
}
