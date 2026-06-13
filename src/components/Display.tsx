"use client";

import { useSettings } from "@/components/SettingsProvider";
import { timeInTz, tzShortName } from "@/lib/datetime";
import { ptTeam } from "@/lib/team-names";

/** Texto traduzido pela chave i18n. */
export function T({ k }: { k: string }) {
  const { t } = useSettings();
  return <>{t(k)}</>;
}

/** Nome de equipa no idioma escolhido (PT traduzido, EN original). */
export function TeamName({ name }: { name: string | null | undefined }) {
  const { lang } = useSettings();
  if (!name) return null;
  return <>{lang === "pt" ? ptTeam(name) : name}</>;
}

export function teamLabel(name: string | null | undefined, lang: string): string {
  if (!name) return "";
  return lang === "pt" ? ptTeam(name) : name;
}

/** Hora do jogo no fuso escolhido. */
export function KickoffTime({ utc }: { utc: string }) {
  const { tz } = useSettings();
  return <>{timeInTz(utc, tz)}</>;
}

/** Etiqueta curta do fuso actual (ex.: WEST). */
export function TzLabel() {
  const { tz, locale } = useSettings();
  return <>{tzShortName(tz, locale)}</>;
}
