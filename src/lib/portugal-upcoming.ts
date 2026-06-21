import { PORTUGAL_TEAM_ID } from "@/lib/world-cup";
import type { Match } from "@/types";

export function isPortugalMatch(match: Pick<Match, "home_team_id" | "away_team_id">): boolean {
  return (
    match.home_team_id === PORTUGAL_TEAM_ID ||
    match.away_team_id === PORTUGAL_TEAM_ID
  );
}

export function getOpponent(match: Match): {
  teamId: number;
  teamName: string;
} {
  if (match.home_team_id === PORTUGAL_TEAM_ID) {
    return { teamId: match.away_team_id, teamName: match.away_team_name };
  }
  return { teamId: match.home_team_id, teamName: match.home_team_name };
}

export function matchPhaseLabel(match: Pick<Match, "group_name" | "round">): string | null {
  return match.group_name ?? match.round ?? null;
}

/** Próximos jogos de Portugal (não terminados), ordenados por kickoff, até `limit`. */
export function getPortugalUpcomingMatches(
  matches: Match[],
  options?: {
    excludeFixtureId?: number | null;
    now?: Date;
    limit?: number;
  }
): Match[] {
  const now = options?.now ?? new Date();
  const limit = options?.limit ?? 3;
  const excludeId = options?.excludeFixtureId ?? null;

  return matches
    .filter((m) => {
      if (!isPortugalMatch(m)) return false;
      if (m.status === "finished") return false;
      if (excludeId != null && m.fixture_id === excludeId) return false;
      if (m.status === "upcoming" && new Date(m.kickoff_utc).getTime() < now.getTime()) {
        return false;
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
    )
    .slice(0, limit);
}
