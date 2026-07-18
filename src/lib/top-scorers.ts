import { isRegulationGoalEvent } from "@/lib/match-result";
import type { Match, MatchGoalEvent } from "@/types";

export type TopScorerRow = {
  player: string;
  team_id: number;
  team_name: string;
  goals: number;
  /** Posição na tabela (empates partilham o mesmo número: 1, 2, 2, 4). */
  rank: number;
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

function withRanks(rows: Omit<TopScorerRow, "rank">[]): TopScorerRow[] {
  let rank = 1;
  return rows.map((row, index) => {
    if (index > 0 && rows[index - 1]!.goals !== row.goals) {
      rank = index + 1;
    }
    return { ...row, rank };
  });
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
      });
    }
  }

  return withRanks(
    [...tallies.values()].sort(
      (a, b) =>
        b.goals - a.goals ||
        a.player.localeCompare(b.player, "pt") ||
        a.team_name.localeCompare(b.team_name, "pt")
    )
  ).slice(0, limit);
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
