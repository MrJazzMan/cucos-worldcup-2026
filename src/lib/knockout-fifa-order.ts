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

export type FifaRoundKey = keyof typeof FIFA_MATCH_NUMBERS;

/** Localização de um jogo FIFA (M73–M104) na coluna+índice da sua ronda. */
export function fifaSlotLocation(matchNumber: number): {
  key: FifaRoundKey;
  index: number;
} {
  for (const key of Object.keys(FIFA_MATCH_NUMBERS) as FifaRoundKey[]) {
    const index = (FIFA_MATCH_NUMBERS[key] as readonly number[]).indexOf(
      matchNumber
    );
    if (index !== -1) return { key, index };
  }
  throw new Error(`Número FIFA desconhecido: M${matchNumber}`);
}

/**
 * Estrutura oficial da árvore eliminatória, por metade (FIFA 2026).
 * Cada nó é o número FIFA do jogo; as folhas são jogos dos dezasseis-avos (R32).
 *
 * A metade esquerda alimenta a meia-final M101 (V97 vs V98); a direita, M102
 * (V99 vs V100). Os emparelhamentos seguem o calendário oficial M73–M104 — ver
 * `KNOCKOUT_SKELETON` em `knockout-bracket.ts`, que é a fonte de verdade.
 *
 *              M101                                  M102
 *           ╱       ╲                            ╱       ╲
 *        M97         M98                      M99         M100
 *       ╱   ╲       ╱   ╲                    ╱   ╲       ╱    ╲
 *     M89   M90   M93   M94                M91   M92   M95   M96
 *     ╱ ╲   ╱ ╲   ╱ ╲   ╱ ╲                ╱ ╲   ╱ ╲   ╱ ╲   ╱ ╲
 *   74 77 73 75 83 84 81 82            76 78 79 80 86 88 85 87
 */
export type BracketNodeSpec = {
  /** Número FIFA do jogo neste nó. */
  match: number;
  /** Sub-árvores que o alimentam (ausente nas folhas R32). */
  children?: [BracketNodeSpec, BracketNodeSpec];
};

const leaf = (match: number): BracketNodeSpec => ({ match });
const node = (
  match: number,
  left: BracketNodeSpec,
  right: BracketNodeSpec
): BracketNodeSpec => ({ match, children: [left, right] });

export const SIDE_TREE_SPEC: Record<"left" | "right", BracketNodeSpec> = {
  left: node(
    101,
    node(97, node(89, leaf(74), leaf(77)), node(90, leaf(73), leaf(75))),
    node(98, node(93, leaf(83), leaf(84)), node(94, leaf(81), leaf(82)))
  ),
  right: node(
    102,
    node(99, node(91, leaf(76), leaf(78)), node(92, leaf(79), leaf(80))),
    node(100, node(95, leaf(86), leaf(88)), node(96, leaf(85), leaf(87)))
  ),
};

function collectLeafIndices(spec: BracketNodeSpec): number[] {
  if (!spec.children) return [fifaSlotLocation(spec.match).index];
  return [
    ...collectLeafIndices(spec.children[0]),
    ...collectLeafIndices(spec.children[1]),
  ];
}

/** Índices R32 (0–15) das folhas de cada metade, em ordem visual (topo→base). */
export const R32_TREE_LEAF_ORDER = {
  left: collectLeafIndices(SIDE_TREE_SPEC.left),
  right: collectLeafIndices(SIDE_TREE_SPEC.right),
} as const;

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
