import { br } from "./locales/br";
import { de } from "./locales/de";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { it } from "./locales/it";
import { nl } from "./locales/nl";
import { pl } from "./locales/pl";
import { pt } from "./locales/pt";
import { LANGS, LOCALES, type Dict, type Lang } from "./types";

export type { Dict, Lang };
export { LANGS, LOCALES };

const dictionaries: Record<Lang, Dict> = {
  pt,
  br,
  en,
  es,
  fr,
  de,
  it,
  nl,
  pl,
};

export function translate(lang: Lang, key: string): string {
  return dictionaries[lang][key] ?? dictionaries.en[key] ?? dictionaries.pt[key] ?? key;
}

export function localeFor(lang: Lang): string {
  return LOCALES[lang];
}

export function detectLangFromBrowser(): Lang {
  if (typeof navigator === "undefined") return "pt";
  const l = navigator.language?.toLowerCase() ?? "";
  if (l.startsWith("pt-br") || l === "pt_br") return "br";
  if (l.startsWith("pt")) return "pt";
  if (l.startsWith("es")) return "es";
  if (l.startsWith("fr")) return "fr";
  if (l.startsWith("de")) return "de";
  if (l.startsWith("pl")) return "pl";
  if (l.startsWith("nl")) return "nl";
  if (l.startsWith("it")) return "it";
  if (l.startsWith("en")) return "en";
  return "pt";
}

export function usesPortugueseTeams(lang: Lang): boolean {
  return lang === "pt" || lang === "br";
}
