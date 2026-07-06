import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Fase final do Mundial 2026 — chave eliminatória",
  description: "Chave eliminatória do Mundial FIFA 2026.",
  path: "/fasefinal",
});

/** Alias legado → rota canónica */
export default function EliminatoriasRedirect() {
  permanentRedirect("/fasefinal");
}
