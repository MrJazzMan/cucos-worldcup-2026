export type ConsentChoice = "pending" | "accepted" | "rejected";

const STORAGE_KEY = "cucos-cookie-consent";

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

export function updateGoogleConsent(granted: boolean) {
  const value = granted ? "granted" : "denied";
  window.gtag?.("consent", "update", {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  });
}
