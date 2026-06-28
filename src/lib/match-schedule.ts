import { dateKeyInTz } from "@/lib/datetime";
import type { Match } from "@/types";

export type MatchDaySection = {
  dayKey: string;
  matches: Match[];
};

/** Cabeçalho de secção (ex. «domingo, 28 de junho de 2026»). */
export function formatScheduleDayHeading(
  dayKey: string,
  tz: string,
  locale: string
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dayKey}T12:00:00Z`));
}

/** Jogos a partir de hoje (inclusive), no fuso do utilizador. */
export function filterMatchesFromToday(
  matches: Match[],
  tz: string,
  todayKey: string
): Match[] {
  return matches.filter(
    (m) => dateKeyInTz(m.kickoff_utc, tz) >= todayKey
  );
}

/** Agrupa jogos por data civil, ordenados cronologicamente. */
export function groupMatchesByCalendarDay(
  matches: Match[],
  tz: string
): MatchDaySection[] {
  const byDay = new Map<string, Match[]>();

  for (const match of matches) {
    const key = dateKeyInTz(match.kickoff_utc, tz);
    const bucket = byDay.get(key);
    if (bucket) bucket.push(match);
    else byDay.set(key, [match]);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dayKey, dayMatches]) => ({
      dayKey,
      matches: [...dayMatches].sort(
        (a, b) =>
          new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
      ),
    }));
}
