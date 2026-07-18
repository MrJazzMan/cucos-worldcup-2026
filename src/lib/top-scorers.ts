import { isRegulationGoalEvent } from "@/lib/match-result";
import type { Match, MatchGoalEvent } from "@/types";

export type TopScorerRow = {
  player: string;
  team_id: number;
  team_name: string;
  goals: number;
  assists: number;
  minutes: number;
  /** Posição após critérios FIFA (golos → assistências → menos minutos). */
  rank: number;
};

/** Forma mínima da resposta `/players/topscorers` (sem importar api-football). */
export type ApiTopScorerEntry = {
  player: {
    id: number;
    name: string;
  };
  statistics: {
    team: { id: number; name: string; logo?: string };
    games: {
      appearences: number | null;
      minutes: number | null;
    };
    goals: {
      total: number | null;
      assists: number | null;
    };
    penalty?: {
      scored: number | null;
      missed: number | null;
    };
  }[];
};

function teamNameForGoal(match: Match, teamId: number): string {
  if (teamId === match.home_team_id) return match.home_team_name;
  if (teamId === match.away_team_id) return match.away_team_name;
  return "";
}

function scorerKey(goal: MatchGoalEvent): string {
  return `${goal.player.toLowerCase()}|${goal.team_id}`;
}

/** Golo que conta para a tabela de marcadores (não autogolo nem desempate). */
export function isScorerGoalEvent(event: MatchGoalEvent): boolean {
  return isRegulationGoalEvent(event) && event.detail !== "Own Goal";
}

/** Ordenação adidas Golden Boot FIFA: golos ↓, assistências ↓, minutos ↑. */
export function compareTopScorersFifa(
  a: Pick<TopScorerRow, "goals" | "assists" | "minutes" | "player" | "team_name">,
  b: Pick<TopScorerRow, "goals" | "assists" | "minutes" | "player" | "team_name">
): number {
  return (
    b.goals - a.goals ||
    b.assists - a.assists ||
    a.minutes - b.minutes ||
    a.player.localeCompare(b.player, "pt") ||
    a.team_name.localeCompare(b.team_name, "pt")
  );
}

function withFifaRanks(
  rows: Omit<TopScorerRow, "rank">[]
): TopScorerRow[] {
  const sorted = [...rows].sort(compareTopScorersFifa);
  return sorted.map((row, index) => ({ ...row, rank: index + 1 }));
}

export function mapApiTopScorers(
  entries: ApiTopScorerEntry[],
  limit = 20
): TopScorerRow[] {
  const rows: Omit<TopScorerRow, "rank">[] = [];

  for (const entry of entries) {
    const stats = entry.statistics?.[0];
    const goals = stats?.goals?.total ?? 0;
    if (!entry.player?.name || !stats?.team?.id || goals <= 0) continue;

    rows.push({
      player: entry.player.name,
      team_id: stats.team.id,
      team_name: stats.team.name,
      goals,
      assists: stats.goals?.assists ?? 0,
      minutes: stats.games?.minutes ?? 0,
    });
  }

  return withFifaRanks(rows).slice(0, limit);
}

/** Melhores marcadores oficiais (API-Football), alinhados com a Golden Boot. */
export async function getOfficialTopScorers(
  limit = 20
): Promise<TopScorerRow[]> {
  if (!process.env.API_FOOTBALL_KEY) return [];

  try {
    const { fetchTopScorers } = await import("@/lib/api-football");
    const data = await fetchTopScorers({ revalidate: 120 });
    return mapApiTopScorers(data, limit);
  } catch (err) {
    console.warn("getOfficialTopScorers failed:", err);
    return [];
  }
}

/** Melhores marcadores do torneio a partir dos golos sincronizados nos jogos. */
export function aggregateTopScorers(
  matches: Match[],
  limit = 10
): TopScorerRow[] {
  const tallies = new Map<string, Omit<TopScorerRow, "rank">>();

  for (const match of matches) {
    for (const goal of match.goal_events ?? []) {
      if (!isScorerGoalEvent(goal)) continue;

      const key = scorerKey(goal);
      const existing = tallies.get(key);
      if (existing) {
        existing.goals++;
        continue;
      }

      tallies.set(key, {
        player: goal.player,
        team_id: goal.team_id,
        team_name: teamNameForGoal(match, goal.team_id),
        goals: 1,
        assists: 0,
        // Sem minutos na agregação — desempate só por nome.
        minutes: Number.MAX_SAFE_INTEGER,
      });
    }
  }

  return withFifaRanks([...tallies.values()]).slice(0, limit);
}

/** Prefere a tabela oficial; se vazia, agrega `goal_events` locais. */
export function resolveTopScorers(
  official: TopScorerRow[],
  matches: Match[],
  limit = 20
): TopScorerRow[] {
  if (official.length > 0) return official.slice(0, limit);
  return aggregateTopScorers(matches, limit);
}

export function countScorersWithGoals(matches: Match[]): number {
  const keys = new Set<string>();
  for (const match of matches) {
    for (const goal of match.goal_events ?? []) {
      if (!isScorerGoalEvent(goal)) continue;
      keys.add(scorerKey(goal));
    }
  }
  return keys.size;
}
