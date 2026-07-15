import type { KnockoutRoundColumn, KnockoutSlotPreview } from "@/lib/knockout-bracket";
import { getWinnerTeamId } from "@/lib/match-result";
import { syntheticFixtureId } from "@/lib/feeder-teams";
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

/** Jogos que alimentam cada eliminatória (casa = 1.º feeder, fora = 2.º). */
export const KNOCKOUT_FEEDERS: Partial<Record<number, readonly [number, number]>> = {
  89: [74, 77],
  90: [73, 75],
  91: [76, 78],
  92: [79, 80],
  93: [83, 84],
  94: [81, 82],
  95: [86, 88],
  96: [85, 87],
  97: [89, 90],
  98: [93, 94],
  99: [91, 92],
  100: [95, 96],
  101: [97, 98],
  102: [99, 100],
  104: [101, 102],
};

function winnerTeamId(match: Match): number | null {
  return getWinnerTeamId(match);
}

/** O par de equipas coincide com os vencedores dos feeders FIFA deste jogo. */
export function teamsMatchFifaFeeders(
  match: Match,
  fifaNumber: number,
  getWinnerAtFifa: (fifa: number) => number | null
): boolean {
  const feeders = KNOCKOUT_FEEDERS[fifaNumber];
  if (!feeders) return false;

  const homeWinner = getWinnerAtFifa(feeders[0]);
  const awayWinner = getWinnerAtFifa(feeders[1]);
  if (homeWinner == null || awayWinner == null) return false;

  const teams = new Set([match.home_team_id, match.away_team_id]);
  return teams.has(homeWinner) && teams.has(awayWinner);
}

export type FifaOrderContext = {
  getWinnerAtFifa: (fifa: number) => number | null;
};

function swapMatchHomeAway(match: Match): Match {
  return {
    ...match,
    home_team_id: match.away_team_id,
    home_team_name: match.away_team_name,
    home_team_logo: match.away_team_logo,
    away_team_id: match.home_team_id,
    away_team_name: match.home_team_name,
    away_team_logo: match.home_team_logo,
    home_score: match.away_score,
    away_score: match.home_score,
    home_pen: match.away_pen ?? null,
    away_pen: match.home_pen ?? null,
  };
}

/** Casa/fora alinhados aos feeders FIFA (ex.: M97 casa = vencedor M89). */
export function alignMatchToFeederOrder(
  match: Match,
  fifaNumber: number,
  getMatchAtFifa: (fifa: number) => Match | undefined
): Match {
  const feeders = KNOCKOUT_FEEDERS[fifaNumber];
  if (!feeders) return match;

  const [homeFeeder, awayFeeder] = feeders;
  const homeMatch = getMatchAtFifa(homeFeeder);
  const awayMatch = getMatchAtFifa(awayFeeder);
  if (!homeMatch || !awayMatch) return match;

  const homeWinner = winnerTeamId(homeMatch);
  const awayWinner = winnerTeamId(awayMatch);
  if (homeWinner == null || awayWinner == null) return match;

  const teams = new Set([match.home_team_id, match.away_team_id]);
  if (!teams.has(homeWinner) || !teams.has(awayWinner)) return match;

  if (match.home_team_id === homeWinner && match.away_team_id === awayWinner) {
    return match;
  }
  if (match.home_team_id === awayWinner && match.away_team_id === homeWinner) {
    return swapMatchHomeAway(match);
  }
  return match;
}

export function alignKnockoutColumns(
  columns: KnockoutRoundColumn[]
): KnockoutRoundColumn[] {
  const cols = columns.map((col) => ({ ...col, matches: [...col.matches] }));

  const getMatchAtFifa = (fifa: number): Match | undefined => {
    const { key, index } = fifaSlotLocation(fifa);
    const col = cols.find((c) => c.key === key);
    if (!col) return undefined;
    return (
      col.matches[index] ??
      col.matches.find((m) => m?.fixture_id === syntheticFixtureId(fifa)) ??
      resolveFifaSlotData(col, index).match
    );
  };

  for (const key of ["r16", "qf", "sf"] as const) {
    const col = cols.find((c) => c.key === key);
    if (!col) continue;
    const fifaNums = FIFA_MATCH_NUMBERS[key];
    col.matches = col.matches.map((match, index) => {
      if (!match) return match;
      const fifa = fifaNums[index];
      if (fifa == null) return match;
      return alignMatchToFeederOrder(match, fifa, getMatchAtFifa);
    });
  }

  return cols;
}

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

function previewResolvableTeams(preview: KnockoutSlotPreview): boolean {
  return !!(
    preview.homeResolved?.team_id ||
    preview.awayResolved?.team_id ||
    preview.homeResolved?.team_name ||
    preview.awayResolved?.team_name
  );
}

/** Casa o jogo real no slot FIFA quando pelo menos uma equipa do skeleton coincide. */
export function teamsMatchSlotLoose(
  match: Match,
  preview: KnockoutSlotPreview
): boolean {
  if (teamsMatchSlot(match, preview)) return true;

  const ids = new Set<number>();
  const names = new Set<string>();
  if (preview.homeResolved?.team_id) ids.add(preview.homeResolved.team_id);
  if (preview.awayResolved?.team_id) ids.add(preview.awayResolved.team_id);
  if (preview.homeResolved?.team_name) names.add(preview.homeResolved.team_name);
  if (preview.awayResolved?.team_name) names.add(preview.awayResolved.team_name);

  if (!ids.size && !names.size) return false;

  const mIds = [match.home_team_id, match.away_team_id];
  const mNames = [match.home_team_name, match.away_team_name];

  if (ids.size >= 2) {
    return mIds.every((id) => ids.has(id));
  }

  if (ids.size === 1) {
    const id = [...ids][0]!;
    return mIds.includes(id);
  }

  if (names.size >= 2) {
    return mNames.every((n) => names.has(n));
  }

  const name = [...names][0]!;
  return mNames.includes(name);
}

export function findMatchForFifaPreview(
  matches: (Match | undefined)[],
  preview: KnockoutSlotPreview
): Match | undefined {
  return matches.find(
    (m): m is Match => m != null && teamsMatchSlotLoose(m, preview)
  );
}

/** Resolve o jogo real para um índice FIFA dentro de uma coluna. */
export function resolveFifaSlotData(
  column: KnockoutRoundColumn,
  fifaIndex: number
): { match?: Match; preview?: KnockoutSlotPreview } {
  const preview = column.previews[fifaIndex];
  if (!preview) return {};

  const atIndex = column.matches[fifaIndex];

  if (column.key === "r32") {
    let match =
      atIndex && teamsMatchSlotLoose(atIndex, preview) ? atIndex : undefined;
    if (!match) {
      match = findMatchForFifaPreview(column.matches, preview);
    }
    return { match, preview };
  }

  const fifaNums = FIFA_MATCH_NUMBERS[column.key as FifaRoundKey];
  const fifa = fifaNums?.[fifaIndex];
  const syntheticId = fifa != null ? syntheticFixtureId(fifa) : null;

  // Preferir fixture real da API; sintéticos só como fallback.
  let match =
    fifa != null
      ? column.matches.find(
          (m) =>
            m != null &&
            m.fixture_id !== syntheticId &&
            teamsMatchSlotLoose(m, preview)
        )
      : undefined;
  if (!match && syntheticId != null) {
    match = column.matches.find((m) => m?.fixture_id === syntheticId);
  }
  if (!match) match = atIndex;
  if (!match) {
    match = findMatchForFifaPreview(column.matches, preview);
  }
  return { match, preview };
}

/** Coloca jogos reais nos índices FIFA correctos (fallback: ordem de kickoff). */
export function orderMatchesInFifaSlots(
  matches: Match[],
  previews: KnockoutSlotPreview[],
  slotCount: number,
  fifaNumbers?: readonly number[],
  context?: FifaOrderContext
): Match[] {
  const slots: (Match | undefined)[] = new Array(slotCount);
  const unmatched = [...matches];

  for (let i = 0; i < Math.min(previews.length, slotCount); i++) {
    const fifa = fifaNumbers?.[i];
    let idx = unmatched.findIndex((m) => teamsMatchSlotLoose(m, previews[i]!));
    if (idx === -1 && fifa != null) {
      idx = unmatched.findIndex((m) => m.fixture_id === syntheticFixtureId(fifa));
    }
    if (idx === -1 && fifa != null && context) {
      idx = unmatched.findIndex((m) =>
        teamsMatchFifaFeeders(m, fifa, context.getWinnerAtFifa)
      );
    }
    if (idx === -1) continue;
    slots[i] = unmatched[idx];
    unmatched.splice(idx, 1);
  }

  const remaining = unmatched.sort(
    (a, b) =>
      new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
  );

  for (const match of remaining) {
    const hole = slots.findIndex(
      (s, i) => s === undefined && !previewResolvableTeams(previews[i]!)
    );
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
