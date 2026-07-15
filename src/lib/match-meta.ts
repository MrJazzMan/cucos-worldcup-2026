import { getMatchPhase, type MatchPhase } from "@/lib/portugal-upcoming";
import { formatVenueShort } from "@/lib/venues";
import { buildFifaNumberByFixtureId } from "@/lib/scheduled-knockout-matches";
import { isSyntheticFixture } from "@/lib/feeder-teams";
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

/**
 * Número do jogo no rodapé.
 * Eliminatórias alinhadas ao calendário FIFA usam 73–104; o resto é
 * sequencial por kickoff (sem colidir com números FIFA já atribuídos).
 */
export function buildMatchNumberMap(
  matches: Pick<
    Match,
    "fixture_id" | "kickoff_utc" | "round" | "group_name" | "status"
  >[]
): Map<number, number> {
  const full = matches as Match[];
  const fifaMap = buildFifaNumberByFixtureId(full);
  const map = new Map<number, number>(fifaMap);
  const used = new Set(map.values());

  const remaining = matches
    .filter((m) => !map.has(m.fixture_id))
    .sort(
      (a, b) =>
        new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
    );

  let n = 1;
  for (const match of remaining) {
    while (used.has(n) || (n >= 73 && n <= 104)) {
      n += 1;
    }
    // Sintéticos sem slot mapeado: extrair do id.
    if (isSyntheticFixture(match.fixture_id)) {
      const fifa = match.fixture_id - 900_000_000;
      if (!used.has(fifa)) {
        map.set(match.fixture_id, fifa);
        used.add(fifa);
        continue;
      }
    }
    map.set(match.fixture_id, n);
    used.add(n);
    n += 1;
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
    const venueLabel = formatVenueShort(match.venue);
    if (venueLabel) parts.push(venueLabel);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}
