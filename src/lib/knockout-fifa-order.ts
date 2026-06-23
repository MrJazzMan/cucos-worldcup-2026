import type { KnockoutSlotPreview } from "@/lib/knockout-bracket";
import type { Match } from "@/types";

/** Número FIFA do jogo (73–104) por índice na coluna da ronda. */
export const FIFA_MATCH_NUMBERS = {
  r32: [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88],
  r16: [89, 90, 91, 92, 93, 94, 95, 96],
  qf: [97, 98, 99, 100],
  sf: [101, 102],
  third: [103],
  final: [104],
} as const;

/**
 * Ordem visual dos dezasseis-avos em cada metade da árvore (índices 0–15 do array FIFA).
 * Garante que o par binário alimenta os oitavos correctos (M89–M92 à esquerda, M93–M96 à direita).
 */
export const R32_TREE_LEAF_ORDER = {
  left: [0, 2, 3, 5, 1, 4, 6, 7],
  right: [8, 9, 10, 11, 12, 14, 13, 15],
} as const;

/** Índices dos nós de oitavos (0–3 por lado) alimentados por cada par de folhas R32. */
export const R32_TO_R16_PAIRINGS = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
] as const;

/** Índice local do oitavo (0–3) produzido por cada par de folhas R32. */
export const R32_PAIR_TO_R16_LOCAL_INDEX = {
  left: [1, 2, 0, 3],
  right: [1, 0, 3, 2],
} as const;

/** Nós de oitavos (índices locais 0–3) que alimentam cada quarto-de-final local. */
export const R16_TO_QF_PAIRINGS = {
  left: [
    [2, 0],
    [1, 3],
  ],
  right: [
    [1, 0],
    [3, 2],
  ],
} as const;

/** Índice local do quarto (0–1 por lado) para cada par de oitavos. */
export const R16_PAIR_TO_QF_LOCAL_INDEX = {
  left: [0, 1],
  right: [0, 1],
} as const;

/** Índices FIFA do quarto-de-final (0–3 global) por par de oitavos. */
export const R16_PAIR_TO_QF_FIFA_INDEX = {
  left: [0, 2],
  right: [1, 3],
} as const;

/** Quartos-de-final locais que alimentam a meia-final desse lado (índice 0 = SF FIFA). */
export const QF_TO_SF_PAIRINGS = [[0, 1]] as const;

function teamIdsFromMatch(match: Match): [number, number] {
  return [match.home_team_id, match.away_team_id];
}

function teamIdsFromPreview(preview: KnockoutSlotPreview): [number, number] | null {
  const home = preview.homeResolved?.team_id;
  const away = preview.awayResolved?.team_id;
  if (!home || !away) return null;
  return [home, away];
}

function teamsMatchSlot(
  match: Match,
  preview: KnockoutSlotPreview
): boolean {
  const slotTeams = teamIdsFromPreview(preview);
  if (!slotTeams) return false;
  const [mh, ma] = teamIdsFromMatch(match);
  const [sh, sa] = slotTeams;
  return (mh === sh && ma === sa) || (mh === sa && ma === sh);
}

/** Coloca jogos reais nos índices FIFA correctos (fallback: ordem de kickoff). */
export function orderMatchesInFifaSlots(
  matches: Match[],
  previews: KnockoutSlotPreview[],
  slotCount: number
): Match[] {
  const slots: (Match | undefined)[] = new Array(slotCount);
  const unmatched = [...matches];

  for (let i = 0; i < Math.min(previews.length, slotCount); i++) {
    const idx = unmatched.findIndex((m) => teamsMatchSlot(m, previews[i]));
    if (idx === -1) continue;
    slots[i] = unmatched[idx];
    unmatched.splice(idx, 1);
  }

  const remaining = unmatched.sort(
    (a, b) =>
      new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
  );

  for (const match of remaining) {
    const hole = slots.findIndex((s) => s === undefined);
    if (hole === -1) break;
    slots[hole] = match;
  }

  const result: Match[] = [];
  for (let i = 0; i < slotCount; i++) {
    if (slots[i] !== undefined) {
      result[i] = slots[i]!;
    }
  }
  return result;
}
