import type { MetadataRoute } from "next";
import { canonicalUrl } from "@/lib/site-metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: canonicalUrl("/"), changeFrequency: "hourly", priority: 1 },
    { url: canonicalUrl("/grupos"), changeFrequency: "daily", priority: 0.8 },
    {
      url: canonicalUrl("/fasefinal"),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
  return entries;
}
