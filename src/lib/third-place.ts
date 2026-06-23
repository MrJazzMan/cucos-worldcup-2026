import {
  getAnnexCAssignment,
  type AnnexCWinnerGroup,
} from "@/lib/knockout-annex-c";
import type { GroupStanding, StandingRow } from "@/types";

export type ThirdPlaceCandidate = {
  groupLetter: string;
  row: StandingRow;
};

function groupLetter(groupName: string): string | null {
  const m = groupName.match(/Grupo\s+([A-L])/i);
  return m ? m[1].toUpperCase() : null;
}

/** 3.º classificado de cada grupo (12 equipas). */
export function getThirdPlaceCandidates(
  standings: GroupStanding[]
): ThirdPlaceCandidate[] {
  const candidates: ThirdPlaceCandidate[] = [];
  for (const group of standings) {
    const letter = groupLetter(group.group_name);
    const row = group.rows.find((r) => r.rank === 3);
    if (!letter || !row) continue;
    candidates.push({ groupLetter: letter, row });
  }
  return candidates;
}

/**
 * FIFA Art. 13 — ranking dos melhores 3.ºs (entre grupos diferentes).
 * Critérios: pontos, dif. golos, golos marcados, nome (sem fair-play na BD).
 */
export function rankThirdPlaceCandidates(
  candidates: ThirdPlaceCandidate[]
): ThirdPlaceCandidate[] {
  return [...candidates].sort(
    (a, b) =>
      b.row.points - a.row.points ||
      b.row.goal_diff - a.row.goal_diff ||
      b.row.goals_for - a.row.goals_for ||
      a.row.team_name.localeCompare(b.row.team_name, "en")
  );
}

/** Os 8 melhores 3.ºs que avançam para os dezasseis-avos. */
export function pickBestThirdPlaceTeams(
  standings: GroupStanding[]
): ThirdPlaceCandidate[] {
  return rankThirdPlaceCandidates(getThirdPlaceCandidates(standings)).slice(
    0,
    8
  );
}

export type ThirdPlaceBracketContext = {
  qualified: ThirdPlaceCandidate[];
  combinationKey: string;
  /** Vencedor do grupo X → letra do grupo do 3.º adversário */
  byWinner: Record<AnnexCWinnerGroup, string>;
};

export function buildThirdPlaceContext(
  standings: GroupStanding[]
): ThirdPlaceBracketContext | null {
  const qualified = pickBestThirdPlaceTeams(standings);
  if (qualified.length < 8) return null;

  const combinationKey = qualified
    .map((q) => q.groupLetter)
    .sort()
    .join("");
  const assignment = getAnnexCAssignment(qualified.map((q) => q.groupLetter));
  if (!assignment) return null;

  return { qualified, combinationKey, byWinner: assignment };
}

/** Resolve slot `3º` quando o adversário é o vencedor de um grupo (ex. home `1E`). */
export function resolveThirdPlaceSlot(
  winnerGroupLetter: string,
  context: ThirdPlaceBracketContext,
  standingsByGroup: Map<string, GroupStanding>
): StandingRow | null {
  const thirdGroupLetter =
    context.byWinner[winnerGroupLetter as AnnexCWinnerGroup];
  if (!thirdGroupLetter) return null;

  const group = standingsByGroup.get(`Grupo ${thirdGroupLetter}`);
  return group?.rows.find((r) => r.rank === 3) ?? null;
}
