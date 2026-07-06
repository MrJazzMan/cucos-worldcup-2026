import type { Metadata } from "next";
import { PrivacyPage } from "@/components/PrivacyPage";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Privacidade — Cucos WC26",
  description: "Política de privacidade e cookies do Cucos WC26.",
  path: "/privacidade",
});

export default function PrivacidadePage() {
  return <PrivacyPage />;
}
