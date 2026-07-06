import type { Metadata } from "next";

const DEFAULT_SITE_URL = "https://wc26.pt";

/** Origem pública do site (sem barra final). */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
  return raw.replace(/\/$/, "");
}

/** URL canónica absoluta para um caminho interno. */
export function canonicalUrl(path = "/"): string {
  if (!path || path === "/") return getSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

type PageMetadataInput = {
  title: string;
  description: string;
  /** Caminho interno, ex. `/grupos`. */
  path: string;
};

/** Metadados de página com canonical absoluto (auditorias SEO/IA). */
export function pageMetadata({
  title,
  description,
  path,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl(path),
    },
  };
}

/** Caminhos públicos indexáveis → URL canónica (aliases incluídos). */
export function canonicalPathForRequest(pathname: string): string | null {
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/feed/") ||
    pathname.startsWith("/calendar/") ||
    pathname === "/conta"
  ) {
    return null;
  }

  if (pathname === "/eliminatorias") return "/fasefinal";

  const indexable = new Set(["/", "/grupos", "/fasefinal", "/privacidade"]);
  return indexable.has(pathname) ? pathname : null;
}
