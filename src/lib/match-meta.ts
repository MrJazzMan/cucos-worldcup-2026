import { getMatchPhase, type MatchPhase } from "@/lib/portugal-upcoming";
import type { Match } from "@/types";

export function localizeMatchPhase(
  phase: MatchPhase,
  t: (k: string) => string
): string {
  if (phase.kind === "group") {
    const base = t("portugalUpcoming.phase.group");
    if (phase.matchday == null) return base;
    const matchday = t("portugalUpcoming.phase.matchday").replace(
      "{n}",
      String(phase.matchday)
    );
    return `${base} · ${matchday}`;
  }
  return t(`portugalUpcoming.phase.${phase.key}`);
}

/** Rótulo da fase do jogo (grupos, oitavos, final, …). */
export function formatMatchPhaseLabel(
  match: Pick<Match, "group_name" | "round">,
  t: (k: string) => string
): string | null {
  const phase = getMatchPhase(match);
  if (!phase) return match.group_name;

  if (phase.kind === "group") {
    const parts: string[] = [localizeMatchPhase(phase, t)];
    if (match.group_name) parts.push(match.group_name);
    return parts.join(" · ");
  }

  return localizeMatchPhase(phase, t);
}

/** Número FIFA do jogo (1…N) por ordem de kickoff no torneio. */
export function buildMatchNumberMap(
  matches: Pick<Match, "fixture_id" | "kickoff_utc">[]
): Map<number, number> {
  const sorted = [...matches].sort(
    (a, b) =>
      new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
  );
  const map = new Map<number, number>();
  for (let i = 0; i < sorted.length; i++) {
    map.set(sorted[i]!.fixture_id, i + 1);
  }
  return map;
}

/** Linha inferior do card: fase · Jogo N · recinto (opcional). */
export function formatMatchMetaFooter(
  match: Pick<Match, "group_name" | "round" | "fixture_id" | "venue">,
  matchNumber: number | undefined,
  t: (k: string) => string,
  options?: { includeVenue?: boolean }
): string | null {
  const parts: string[] = [];
  const phase = formatMatchPhaseLabel(match, t);
  if (phase) parts.push(phase);
  if (matchNumber != null) {
    parts.push(t("card.matchNumber").replace("{n}", String(matchNumber)));
  }
  if (options?.includeVenue && match.venue) {
    parts.push(match.venue);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}
