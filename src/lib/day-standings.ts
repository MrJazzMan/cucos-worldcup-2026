import { dateKeyInTz } from "@/lib/datetime";
import { isKnockoutRound } from "@/lib/knockout-bracket";
import { getMatchPhase, isPortugalMatch } from "@/lib/portugal-upcoming";
import { PORTUGAL_TEAM_ID } from "@/lib/world-cup";
import type { GroupStanding, Match } from "@/types";

function resolveGroupName(
  m: Pick<Match, "group_name" | "round">
): string | null {
  if (m.group_name) return m.group_name;
  const match = (m.round ?? "").match(/Group\s+([A-L])/i);
  return match ? `Grupo ${match[1].toUpperCase()}` : null;
}

function buildTeamToGroupMap(standings: GroupStanding[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const group of standings) {
    for (const row of group.rows) {
      map.set(row.team_id, group.group_name);
    }
  }
  return map;
}

export function findPortugalGroupName(
  standings: GroupStanding[]
): string | null {
  for (const group of standings) {
    if (group.rows.some((row) => row.team_id === PORTUGAL_TEAM_ID)) {
      return group.group_name;
    }
  }
  return null;
}

/** Portugal ainda na fase de grupos (sem jogos de eliminatórias). */
export function isPortugalInGroupPhase(matches: Match[]): boolean {
  const portugalMatches = matches.filter(isPortugalMatch);
  if (portugalMatches.length === 0) return false;
  return !portugalMatches.some((m) => getMatchPhase(m)?.kind === "knockout");
}

function resolveMatchGroupName(
  match: Pick<Match, "group_name" | "round" | "home_team_id" | "away_team_id">,
  teamToGroup: Map<number, string>
): string | null {
  return (
    resolveGroupName(match) ??
    teamToGroup.get(match.home_team_id) ??
    teamToGroup.get(match.away_team_id) ??
    null
  );
}

/**
 * Grupos a mostrar no resumo do dia: grupos com jogos no dia seleccionado
 * + grupo de Portugal se ainda estiver na fase de grupos.
 */
export function getDayStandingsGroups(
  matches: Match[],
  standings: GroupStanding[],
  selectedDay: string,
  tz: string
): GroupStanding[] {
  if (standings.length === 0) return [];

  const teamToGroup = buildTeamToGroupMap(standings);
  const groupNames = new Set<string>();

  for (const match of matches) {
    if (dateKeyInTz(match.kickoff_utc, tz) !== selectedDay) continue;
    if (isKnockoutRound(match.round) && !match.group_name) continue;

    const groupName = resolveMatchGroupName(match, teamToGroup);
    if (groupName) groupNames.add(groupName);
  }

  if (isPortugalInGroupPhase(matches)) {
    const portugalGroup = findPortugalGroupName(standings);
    if (portugalGroup) groupNames.add(portugalGroup);
  }

  if (groupNames.size === 0) return [];

  return standings
    .filter((group) => groupNames.has(group.group_name))
    .sort((a, b) => a.group_name.localeCompare(b.group_name, "pt"));
}
