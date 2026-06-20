/** URL pública de produção (QStash, auth redirects, etc.) */
export function getSiteUrl(): string {
  const raw =
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://wc26.pt";
  return raw.replace(/\/$/, "");
}
