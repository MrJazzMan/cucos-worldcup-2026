"use client";

import { useSettings } from "@/components/SettingsProvider";
import { formatCompactMatchDate, timeInTz, tzShortName } from "@/lib/datetime";
import { usesPortugueseTeams, type Lang } from "@/lib/i18n";
import { parseFeederPlaceholder } from "@/lib/feeder-teams";
import { ptTeam } from "@/lib/team-names";

/** Texto traduzido pela chave i18n. */
export function T({ k }: { k: string }) {
  const { t } = useSettings();
  return <>{t(k)}</>;
}

/** Nome de equipa no idioma escolhido (PT traduzido, EN original). */
export function TeamName({ name }: { name: string | null | undefined }) {
  const { t, lang } = useSettings();
  if (!name) return null;
  const feeder = parseFeederPlaceholder(name);
  if (feeder != null) {
    const key =
      feeder.kind === "loser" ? "card.feederLoser" : "card.feederWinner";
    return <>{t(key).replace("{n}", String(feeder.fifa))}</>;
  }
  return <>{usesPortugueseTeams(lang) ? ptTeam(name) : name}</>;
}

export function teamLabel(name: string | null | undefined, lang: Lang): string {
  if (!name) return "";
  if (parseFeederPlaceholder(name)) return name;
  return usesPortugueseTeams(lang) ? ptTeam(name) : name;
}

/** Hora do jogo no fuso escolhido. */
export function KickoffTime({ utc }: { utc: string }) {
  const { tz } = useSettings();
  return <>{timeInTz(utc, tz)}</>;
}

/** Data discreta para cartões (ex.: 22 jun). */
export function MatchCompactDate({ utc }: { utc: string }) {
  const { tz, locale } = useSettings();
  return <>{formatCompactMatchDate(utc, tz, locale)}</>;
}

/** Etiqueta curta do fuso actual (ex.: WEST). */
export function TzLabel() {
  const { tz, locale } = useSettings();
  return <>{tzShortName(tz, locale)}</>;
}
