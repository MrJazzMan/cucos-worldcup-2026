export type Dict = Record<string, string>;

export type Lang =
  | "pt"
  | "en"
  | "es"
  | "fr"
  | "de"
  | "pl"
  | "nl"
  | "it"
  | "br"
  | "qa"
  | "ae"
  | "sa";

export const LANGS: { value: Lang; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "pt", label: "Português (PT)", flag: "🇵🇹" },
  { value: "br", label: "Português (BR)", flag: "🇧🇷" },
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
  { value: "it", label: "Italiano", flag: "🇮🇹" },
  { value: "nl", label: "Nederlands", flag: "🇳🇱" },
  { value: "pl", label: "Polski", flag: "🇵🇱" },
  { value: "qa", label: "العربية (قطر)", flag: "🇶🇦" },
  { value: "ae", label: "العربية (الإمارات)", flag: "🇦🇪" },
  { value: "sa", label: "العربية (السعودية)", flag: "🇸🇦" },
];

export const LOCALES: Record<Lang, string> = {
  en: "en-GB",
  pt: "pt-PT",
  br: "pt-BR",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  nl: "nl-NL",
  pl: "pl-PL",
  qa: "ar-QA",
  ae: "ar-AE",
  sa: "ar-SA",
};

export function isRtlLang(lang: Lang): boolean {
  return lang === "qa" || lang === "ae" || lang === "sa";
}

// Types and language metadata only
