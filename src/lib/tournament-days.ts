import { dateKeyInTz } from "@/lib/datetime";

/**
 * Hora local (0–23): jogos antes desta hora contam para o dia de jogos anterior.
 * Ex.: às 02:00 de 22/06 em Lisboa → ainda é o «dia 10» que começou às 17h de 21/06.
 */
export const MATCH_DAY_CUTOFF_HOUR = 6;

export type TournamentDay<T extends { kickoff_utc: string } = { kickoff_utc: string }> = {
  id: string;
  number: number;
  matches: T[];
  /** Data-sessão (após corte madrugada) — início lógico do dia de jogos. */
  sessionStartKey: string;
  /** Última data civil com jogos neste dia de torneio. */
  sessionEndKey: string;
};

/** Data-sessão de um jogo (pode ser o dia civil anterior se for de madrugada). */
export function matchSessionDateKey(
  utcIso: string,
  tz: string,
  cutoffHour = MATCH_DAY_CUTOFF_HOUR
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date(utcIso));

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  let dateKey = `${y}-${m}-${d}`;

  if (hour < cutoffHour) {
    const anchor = new Date(`${dateKey}T12:00:00Z`);
    anchor.setUTCDate(anchor.getUTCDate() - 1);
    dateKey = anchor.toISOString().slice(0, 10);
  }

  return dateKey;
}

/** Agrupa jogos em dias de torneio numerados (1, 2, 3…). */
export function buildTournamentDays<T extends { kickoff_utc: string }>(
  matches: T[],
  tz: string
): TournamentDay<T>[] {
  if (matches.length === 0) return [];

  const bySession = new Map<string, T[]>();
  for (const match of matches) {
    const key = matchSessionDateKey(match.kickoff_utc, tz);
    const bucket = bySession.get(key);
    if (bucket) bucket.push(match);
    else bySession.set(key, [match]);
  }

  return [...bySession.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([sessionKey, dayMatches], index) => {
      const sorted = [...dayMatches].sort(
        (a, b) =>
          new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
      );
      const calendarDates = sorted
        .map((m) => dateKeyInTz(m.kickoff_utc, tz))
        .sort();

      return {
        id: `td-${index + 1}`,
        number: index + 1,
        matches: sorted,
        sessionStartKey: sessionKey,
        sessionEndKey: calendarDates[calendarDates.length - 1]!,
      };
    });
}

export function findActiveTournamentDayId<T extends { kickoff_utc: string; status?: string }>(
  days: TournamentDay<T>[],
  todayKey: string
): string | null {
  if (days.length === 0) return null;

  const liveDay = days.find((d) =>
    d.matches.some((m) => m.status === "live")
  );
  if (liveDay) return liveDay.id;

  const todayDay = days.find(
    (d) =>
      d.sessionStartKey <= todayKey &&
      todayKey <= d.sessionEndKey
  );
  if (todayDay) return todayDay.id;

  const future = days.find((d) => d.sessionStartKey > todayKey);
  if (future) return future.id;

  return days[days.length - 1]!.id;
}

/** Rótulo curto do intervalo de datas (ex. «21–22 jun»). */
export function formatTournamentDayRange(
  day: Pick<TournamentDay, "sessionStartKey" | "sessionEndKey">,
  tz: string,
  locale: string
): string {
  const fmt = (key: string) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      day: "numeric",
      month: "short",
    }).format(new Date(`${key}T12:00:00Z`));

  const start = fmt(day.sessionStartKey);
  if (day.sessionStartKey === day.sessionEndKey) return start;
  return `${start} – ${fmt(day.sessionEndKey)}`;
}
