export type ConsentChoice = "pending" | "accepted" | "rejected";

const STORAGE_KEY = "cucos-cookie-consent";
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function readConsent(): ConsentChoice {
  if (typeof window === "undefined") return "pending";
  const value = localStorage.getItem(STORAGE_KEY);
  if (value === "accepted" || value === "rejected") return value;
  return "pending";
}

export function writeConsent(choice: Exclude<ConsentChoice, "pending">) {
  localStorage.setItem(STORAGE_KEY, choice);
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    adsbygoogle?: Record<string, unknown>[];
  }
}

/** Consent Mode v2 — executar no <head> ANTES de qualquer script Google. */
export const CONSENT_MODE_DEFAULT_SCRIPT = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
  wait_for_update: 500
});
`;

export function updateGoogleConsent(granted: boolean) {
  const value = granted ? "granted" : "denied";
  window.gtag?.("consent", "update", {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
    functionality_storage: value,
    personalization_storage: value,
  });
}

let gaScriptLoaded = false;

/** Carrega gtag/GA4 apenas após consentimento (analytics_storage granted). */
export function loadGoogleAnalytics(): void {
  if (typeof window === "undefined" || !GA_ID || gaScriptLoaded) return;
  gaScriptLoaded = true;

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer!.push(args);
    };
  }

  const script = document.createElement("script");
  script.id = "ga-gtag";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", GA_ID, {
    anonymize_ip: true,
    send_page_view: true,
  });
}

/** Para testes: repõe estado de carregamento do GA. */
export function resetGoogleAnalyticsForTests(): void {
  gaScriptLoaded = false;
}

export function isGoogleAnalyticsLoaded(): boolean {
  return gaScriptLoaded;
}

export { GA_ID };
