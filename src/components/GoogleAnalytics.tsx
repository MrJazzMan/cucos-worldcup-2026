"use client";

import { useEffect } from "react";
import { useConsent } from "@/components/ConsentProvider";
import {
  GA_ID,
  loadGoogleAnalytics,
  updateGoogleConsent,
} from "@/lib/consent";

/** Só carrega GA4 depois de consentimento; Consent Mode default fica no <head>. */
export function GoogleAnalyticsLoader() {
  const { consent } = useConsent();

  useEffect(() => {
    if (!GA_ID) return;

    if (consent === "accepted") {
      updateGoogleConsent(true);
      loadGoogleAnalytics();
    } else if (consent === "rejected") {
      updateGoogleConsent(false);
    }
  }, [consent]);

  return null;
}
