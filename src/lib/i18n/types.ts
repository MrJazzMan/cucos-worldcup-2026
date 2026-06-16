export type Dict = Record<string, string>;

export type Lang = "pt" | "en" | "es" | "fr" | "de" | "pl" | "nl" | "it" | "br";

export const LANGS: { value: Lang; label: string; flag: string }[] = [
  { value: "pt", label: "Português (PT)", flag: "🇵🇹" },
  { value: "br", label: "Português (BR)", flag: "🇧🇷" },
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
  { value: "it", label: "Italiano", flag: "🇮🇹" },
  { value: "nl", label: "Nederlands", flag: "🇳🇱" },
  { value: "pl", label: "Polski", flag: "🇵🇱" },
];

export const LOCALES: Record<Lang, string> = {
  pt: "pt-PT",
  br: "pt-BR",
  en: "en-GB",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  nl: "nl-NL",
  pl: "pl-PL",
};

// Types and language metadata only
