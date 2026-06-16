import type { Metadata } from "next";
import { PrivacyPage } from "@/components/PrivacyPage";

export const metadata: Metadata = {
  title: "Privacidade — Cucos WC26",
  description: "Política de privacidade e cookies do Cucos WC26.",
};

export default function PrivacidadePage() {
  return <PrivacyPage />;
}
