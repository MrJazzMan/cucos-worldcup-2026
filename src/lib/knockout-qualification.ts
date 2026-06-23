import type { GroupStanding, StandingRow } from "@/types";

/** Jogos por equipa na fase de grupos (Mundial 2026). */
export const GROUP_MATCHES_PER_TEAM = 3;

export type ResolvedSlotSide = {
  code: string;
  team_id?: number;
  team_name?: string;
  team_logo?: string | null;
  /** Qualificação matematicamente garantida (ainda há jogos por disputar). */
  confirmed?: boolean;
};

type TeamProjection = StandingRow & {
  remaining: number;
  maxPoints: number;
  minPoints: number;
};

function projectTeam(row: StandingRow): TeamProjection {
  const remaining = Math.max(0, GROUP_MATCHES_PER_TEAM - row.played);
  return {
    ...row,
    remaining,
    maxPoints: row.points + remaining * 3,
    minPoints: row.points,
  };
}

function isGroupComplete(group: GroupStanding): boolean {
  return group.rows.length > 0 && group.rows.every((r) => r.played >= GROUP_MATCHES_PER_TEAM);
}

/** Posições 1.º/2.º matematicamente garantidas por equipa (team_id → rank). */
export function getMathematicalLocks(
  group: GroupStanding
): Map<number, 1 | 2> {
  const teams = group.rows.map(projectTeam);
  const locks = new Map<number, 1 | 2>();

  for (const team of teams) {
    const others = teams.filter((t) => t.team_id !== team.team_id);
    const maxOtherPoints = Math.max(...others.map((t) => t.maxPoints), -1);

    if (team.minPoints > maxOtherPoints) {
      locks.set(team.team_id, 1);
      continue;
    }

    const canFinishAbove = others.filter((t) => t.maxPoints > team.minPoints).length;
    if (canFinishAbove === 1) {
      locks.set(team.team_id, 2);
    }
  }

  return locks;
}

function parseGroupSlot(
  code: string
): { rank: 1 | 2; groupLetter: string } | null {
  const m = code.match(/^([12])([A-L])$/);
  if (!m) return null;
  return { rank: Number(m[1]) as 1 | 2, groupLetter: m[2] };
}

export function resolveSlotCode(
  code: string,
  standingsByGroup: Map<string, GroupStanding>,
  locksByGroup: Map<string, Map<number, 1 | 2>>
): ResolvedSlotSide {
  const slot = parseGroupSlot(code);
  if (!slot) return { code };

  const groupName = `Grupo ${slot.groupLetter}`;
  const group = standingsByGroup.get(groupName);
  if (!group) return { code };

  const row = group.rows.find((r) => r.rank === slot.rank);
  if (!row) return { code };

  const complete = isGroupComplete(group);
  const lockedRank = locksByGroup.get(groupName)?.get(row.team_id);
  const confirmed = lockedRank === slot.rank;
  const showTeam = complete || confirmed;

  if (!showTeam) return { code };

  return {
    code,
    team_id: row.team_id,
    team_name: row.team_name,
    team_logo: row.team_logo,
    confirmed: complete || confirmed,
  };
}

export function buildStandingsMaps(standings: GroupStanding[]) {
  const standingsByGroup = new Map(standings.map((g) => [g.group_name, g]));
  const locksByGroup = new Map(
    standings.map((g) => [g.group_name, getMathematicalLocks(g)])
  );
  return { standingsByGroup, locksByGroup };
}

export function enrichSlotPreview(
  preview: { home: string; away: string },
  standingsByGroup: Map<string, GroupStanding>,
  locksByGroup: Map<string, Map<number, 1 | 2>>
) {
  return {
    ...preview,
    homeResolved: resolveSlotCode(preview.home, standingsByGroup, locksByGroup),
    awayResolved: resolveSlotCode(preview.away, standingsByGroup, locksByGroup),
  };
}
