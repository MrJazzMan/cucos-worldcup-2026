import type { MetadataRoute } from "next";
import { KNOCKOUTS_ENABLED } from "@/lib/features";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/grupos`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/privacidade`, changeFrequency: "monthly", priority: 0.3 },
  ];
  if (KNOCKOUTS_ENABLED) {
    entries.push({
      url: `${base}/eliminatorias`,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }
  return entries;
}
