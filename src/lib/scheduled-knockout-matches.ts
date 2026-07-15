import {
  feederPlaceholderName,
  isSyntheticFixture,
  SYNTHETIC_FIXTURE_BASE,
  syntheticFixtureId,
} from "@/lib/feeder-teams";
import { buildKnockoutColumns, knockoutRoundKey } from "@/lib/knockout-bracket";
import {
  FIFA_MATCH_NUMBERS,
  teamsMatchFifaFeeders,
} from "@/lib/knockout-fifa-order";
import { getLoserTeamId, getWinnerTeamId } from "@/lib/match-result";
import { formatMatchDate } from "@/lib/timezone";
import type { Match } from "@/types";

import type { FeederKind } from "@/lib/feeder-teams";

type ScheduledKnockout = {
  fifa: number;
  homeFeeder: number;
  awayFeeder: number;
  homeFeederKind?: FeederKind;
  awayFeederKind?: FeederKind;
  kickoff_utc: string;
  venue: string;
  round: string;
};

/** Calendário FIFA M89–M96 (horários UTC, recintos oficiais). */
const OFFICIAL_R16: ScheduledKnockout[] = [
  {
    fifa: 89,
    homeFeeder: 74,
    awayFeeder: 77,
    kickoff_utc: "2026-07-04T21:00:00.000Z",
    venue: "Philadelphia · Lincoln Financial Field",
    round: "Round of 16",
  },
  {
    fifa: 90,
    homeFeeder: 73,
    awayFeeder: 75,
    kickoff_utc: "2026-07-04T17:00:00.000Z",
    venue: "Houston · NRG Stadium",
    round: "Round of 16",
  },
  {
    fifa: 91,
    homeFeeder: 76,
    awayFeeder: 78,
    kickoff_utc: "2026-07-05T20:00:00.000Z",
    venue: "East Rutherford · MetLife Stadium",
    round: "Round of 16",
  },
  {
    fifa: 92,
    homeFeeder: 79,
    awayFeeder: 80,
    kickoff_utc: "2026-07-06T00:00:00.000Z",
    venue: "Mexico City · Estadio Azteca",
    round: "Round of 16",
  },
  {
    fifa: 93,
    homeFeeder: 83,
    awayFeeder: 84,
    kickoff_utc: "2026-07-06T19:00:00.000Z",
    venue: "Dallas · AT&T Stadium",
    round: "Round of 16",
  },
  {
    fifa: 94,
    homeFeeder: 81,
    awayFeeder: 82,
    kickoff_utc: "2026-07-07T00:00:00.000Z",
    venue: "Seattle · Lumen Field",
    round: "Round of 16",
  },
  {
    fifa: 95,
    homeFeeder: 86,
    awayFeeder: 88,
    kickoff_utc: "2026-07-07T16:00:00.000Z",
    venue: "Atlanta · Mercedes-Benz Stadium",
    round: "Round of 16",
  },
  {
    fifa: 96,
    homeFeeder: 85,
    awayFeeder: 87,
    kickoff_utc: "2026-07-07T20:00:00.000Z",
    venue: "Vancouver · BC Place",
    round: "Round of 16",
  },
];

/** Calendário FIFA M97–M100. */
const OFFICIAL_QF: ScheduledKnockout[] = [
  {
    fifa: 97,
    homeFeeder: 89,
    awayFeeder: 90,
    kickoff_utc: "2026-07-09T20:00:00.000Z",
    venue: "Boston · Gillette Stadium",
    round: "Quarter-finals",
  },
  {
    fifa: 98,
    homeFeeder: 93,
    awayFeeder: 94,
    kickoff_utc: "2026-07-10T19:00:00.000Z",
    venue: "Inglewood · SoFi Stadium",
    round: "Quarter-finals",
  },
  {
    fifa: 99,
    homeFeeder: 91,
    awayFeeder: 92,
    kickoff_utc: "2026-07-11T21:00:00.000Z",
    venue: "Miami · Hard Rock Stadium",
    round: "Quarter-finals",
  },
  {
    fifa: 100,
    homeFeeder: 95,
    awayFeeder: 96,
    kickoff_utc: "2026-07-12T01:00:00.000Z",
    venue: "Kansas City · Arrowhead Stadium",
    round: "Quarter-finals",
  },
];

/** Calendário FIFA M101–M102. */
const OFFICIAL_SF: ScheduledKnockout[] = [
  {
    fifa: 101,
    homeFeeder: 97,
    awayFeeder: 98,
    kickoff_utc: "2026-07-14T19:00:00.000Z",
    venue: "Dallas · AT&T Stadium",
    round: "Semi-finals",
  },
  {
    fifa: 102,
    homeFeeder: 99,
    awayFeeder: 100,
    kickoff_utc: "2026-07-15T19:00:00.000Z",
    venue: "Atlanta · Mercedes-Benz Stadium",
    round: "Semi-finals",
  },
];

/** Calendário FIFA M103 (3.º/4.º — perdedores das meias). */
const OFFICIAL_THIRD: ScheduledKnockout[] = [
  {
    fifa: 103,
    homeFeeder: 101,
    awayFeeder: 102,
    homeFeederKind: "loser",
    awayFeederKind: "loser",
    kickoff_utc: "2026-07-18T21:00:00.000Z",
    venue: "Miami · Hard Rock Stadium",
    round: "3rd Place Final",
  },
];

/** Calendário FIFA M104. */
const OFFICIAL_FINAL: ScheduledKnockout[] = [
  {
    fifa: 104,
    homeFeeder: 101,
    awayFeeder: 102,
    kickoff_utc: "2026-07-19T19:00:00.000Z",
    venue: "East Rutherford · MetLife Stadium",
    round: "Final",
  },
];

type FeederSide = {
  team_id: number;
  team_name: string;
  team_logo: string | null;
};

function teamFromMatchSide(match: Match, teamId: number): FeederSide {
  if (match.home_team_id === teamId) {
    return {
      team_id: match.home_team_id,
      team_name: match.home_team_name,
      team_logo: match.home_team_logo,
    };
  }
  return {
    team_id: match.away_team_id,
    team_name: match.away_team_name,
    team_logo: match.away_team_logo,
  };
}

function knockoutOutcome(match: Match, kind: FeederKind): FeederSide | null {
  const teamId =
    kind === "winner" ? getWinnerTeamId(match) : getLoserTeamId(match);
  if (teamId == null) return null;
  return teamFromMatchSide(match, teamId);
}

function placeholderSide(
  fifaMatchNumber: number,
  kind: FeederKind = "winner"
): FeederSide {
  return {
    team_id: syntheticFixtureId(fifaMatchNumber),
    team_name: feederPlaceholderName(fifaMatchNumber, kind),
    team_logo: null,
  };
}

function buildFifaR32Map(matches: Match[]): Map<number, Match> {
  const r32Matches = matches.filter(
    (m) => knockoutRoundKey(m.round) === "r32"
  );
  if (!r32Matches.length) return new Map();

  const columns = buildKnockoutColumns([
    { round: "Round of 32", matches: r32Matches },
  ]);
  const r32Col = columns.find((c) => c.key === "r32");
  if (!r32Col) return new Map();

  const map = new Map<number, Match>();
  for (let i = 0; i < FIFA_MATCH_NUMBERS.r32.length; i++) {
    const match = r32Col.matches[i];
    if (match) {
      map.set(FIFA_MATCH_NUMBERS.r32[i]!, match);
    }
  }
  return map;
}

function resolveFeederSide(
  fifaMatchNumber: number,
  kind: FeederKind,
  byFifa: Map<number, Match>
): FeederSide {
  const feeder = byFifa.get(fifaMatchNumber);
  if (feeder) {
    const outcome = knockoutOutcome(feeder, kind);
    if (outcome) return outcome;
  }
  return placeholderSide(fifaMatchNumber, kind);
}

function buildSyntheticMatch(
  slot: ScheduledKnockout,
  byFifa: Map<number, Match>
): Match {
  const homeKind = slot.homeFeederKind ?? "winner";
  const awayKind = slot.awayFeederKind ?? "winner";
  const home = resolveFeederSide(slot.homeFeeder, homeKind, byFifa);
  const away = resolveFeederSide(slot.awayFeeder, awayKind, byFifa);

  return {
    fixture_id: syntheticFixtureId(slot.fifa),
    kickoff_utc: slot.kickoff_utc,
    match_date: formatMatchDate(slot.kickoff_utc),
    home_team_id: home.team_id,
    home_team_name: home.team_name,
    home_team_logo: home.team_logo,
    away_team_id: away.team_id,
    away_team_name: away.team_name,
    away_team_logo: away.team_logo,
    home_score: null,
    away_score: null,
    status: "upcoming",
    minute: null,
    round: slot.round,
    group_name: null,
    venue: slot.venue,
    channels: [],
  };
}

function getWinnerLookup(
  byFifa: Map<number, Match>
): (fifa: number) => number | null {
  return (fifa) => {
    const match = byFifa.get(fifa);
    return match ? getWinnerTeamId(match) : null;
  };
}

function statusRank(match: Match): number {
  if (match.status === "finished") return 3;
  if (match.status === "live") return 2;
  return 1;
}

/** Preferir FT > live > upcoming quando há vários candidatos para o mesmo slot. */
function preferRicherMatch(a: Match, b: Match): Match {
  const rankDiff = statusRank(a) - statusRank(b);
  if (rankDiff !== 0) return rankDiff > 0 ? a : b;
  const aScores = (a.home_score ?? -1) + (a.away_score ?? -1);
  const bScores = (b.home_score ?? -1) + (b.away_score ?? -1);
  return aScores >= bScores ? a : b;
}

function pickBestMatch(candidates: Match[]): Match | undefined {
  if (!candidates.length) return undefined;
  return candidates.reduce((best, cur) => preferRicherMatch(best, cur));
}

function findRealMatchForSlot(
  slot: ScheduledKnockout,
  matches: Match[],
  byFifa: Map<number, Match>
): Match | undefined {
  const syntheticId = syntheticFixtureId(slot.fifa);
  const realCandidates = matches.filter(
    (m) => !isSyntheticFixture(m.fixture_id) && m.fixture_id !== syntheticId
  );

  const byFeeders = realCandidates.filter((m) => {
    if (slot.homeFeederKind === "loser" || slot.awayFeederKind === "loser") {
      const home = resolveFeederSide(
        slot.homeFeeder,
        slot.homeFeederKind ?? "winner",
        byFifa
      );
      const away = resolveFeederSide(
        slot.awayFeeder,
        slot.awayFeederKind ?? "winner",
        byFifa
      );
      if (isSyntheticFixture(home.team_id) || isSyntheticFixture(away.team_id)) {
        return false;
      }
      const ids = new Set([m.home_team_id, m.away_team_id]);
      return ids.has(home.team_id) && ids.has(away.team_id);
    }
    return teamsMatchFifaFeeders(m, slot.fifa, getWinnerLookup(byFifa));
  });
  const bestByFeeders = pickBestMatch(byFeeders);
  if (bestByFeeders) return bestByFeeders;

  const expectedHome = resolveFeederSide(
    slot.homeFeeder,
    slot.homeFeederKind ?? "winner",
    byFifa
  );
  const expectedAway = resolveFeederSide(
    slot.awayFeeder,
    slot.awayFeederKind ?? "winner",
    byFifa
  );
  const feedersResolved =
    !isSyntheticFixture(expectedHome.team_id) &&
    !isSyntheticFixture(expectedAway.team_id);

  // Quando os dois feeders já estão resolvidos, nunca associar apenas pela
  // hora: foi assim que França–Cabo Verde ocupou indevidamente o slot M101.
  if (feedersResolved) return undefined;

  const slotRound = knockoutRoundKey(slot.round);
  const slotKick = new Date(slot.kickoff_utc).getTime();
  // Fallback apenas enquanto os feeders ainda não estão resolvidos.
  const byKickoff = realCandidates.filter((m) => {
    if (knockoutRoundKey(m.round) !== slotRound) return false;
    return (
      Math.abs(new Date(m.kickoff_utc).getTime() - slotKick) <=
      3 * 60 * 60 * 1000
    );
  });
  return pickBestMatch(byKickoff);
}

function findMatchCoveringFifa(
  fifa: number,
  matches: Match[],
  byFifa: Map<number, Match>
): Match | undefined {
  const syntheticId = syntheticFixtureId(fifa);
  const direct = matches.find((m) => m.fixture_id === syntheticId);
  if (direct && !isSyntheticFixture(direct.fixture_id)) return direct;

  const real = matches.find(
    (m) =>
      !isSyntheticFixture(m.fixture_id) &&
      teamsMatchFifaFeeders(m, fifa, getWinnerLookup(byFifa))
  );
  if (real) return real;

  if (direct) return direct;
  return byFifa.get(fifa);
}

function allOfficialSlots(): ScheduledKnockout[] {
  return [
    ...OFFICIAL_R16,
    ...OFFICIAL_QF,
    ...OFFICIAL_SF,
    ...OFFICIAL_THIRD,
    ...OFFICIAL_FINAL,
  ];
}

function rebuildFifaMap(matches: Match[]): Map<number, Match> {
  const map = buildFifaR32Map(matches);

  for (const slot of allOfficialSlots()) {
    // Sempre preferir fixture real da API; sintético só como fallback.
    const real = findRealMatchForSlot(slot, matches, map);
    if (real) {
      map.set(slot.fifa, real);
      continue;
    }

    const syntheticId = syntheticFixtureId(slot.fifa);
    const byId = matches.find((m) => m.fixture_id === syntheticId);
    if (byId) {
      map.set(slot.fifa, byId);
    }
  }

  return map;
}

/** Remove sintéticos cujo slot FIFA já tem fixture real. */
function dropCoveredSynthetics(matches: Match[]): Match[] {
  const byFifa = rebuildFifaMap(matches);
  const coveredSyntheticIds = new Set<number>();

  for (const slot of allOfficialSlots()) {
    const mapped = byFifa.get(slot.fifa);
    if (!mapped || isSyntheticFixture(mapped.fixture_id)) continue;
    coveredSyntheticIds.add(syntheticFixtureId(slot.fifa));
  }

  if (!coveredSyntheticIds.size) return matches;
  const filtered = matches.filter(
    (m) => !coveredSyntheticIds.has(m.fixture_id)
  );
  return filtered.length === matches.length ? matches : filtered;
}

/**
 * A API pode devolver jogos extra com nomes de ronda eliminatória. Mantém
 * apenas o único fixture que cobre cada slot oficial M89–M104.
 */
function dropUnmappedOfficialRoundMatches(matches: Match[]): Match[] {
  const byFifa = rebuildFifaMap(matches);
  const officialFixtureIds = new Set(
    [...byFifa.entries()]
      .filter(([fifa]) => fifa >= 89 && fifa <= 104)
      .map(([, match]) => match.fixture_id)
  );
  // O problema observado é em fases com poucos slots e feeders já resolvidos.
  // R16/QF podem chegar parcialmente e com ordenação diferente da API; não
  // remover esses jogos aqui.
  const officialRoundKeys = new Set(["sf", "third", "final"]);

  const filtered = matches.filter((match) => {
    const roundKey = knockoutRoundKey(match.round);
    if (!roundKey || !officialRoundKeys.has(roundKey)) return true;
    return officialFixtureIds.has(match.fixture_id);
  });

  return filtered.length === matches.length ? matches : filtered;
}

function mergeOfficialRound(
  matches: Match[],
  slots: ScheduledKnockout[],
  minPriorFifas: number
): Match[] {
  let byFifa = rebuildFifaMap(matches);
  if (byFifa.size < minPriorFifas) return matches;

  const out = [...matches];
  let changed = false;

  for (const slot of slots) {
    byFifa = rebuildFifaMap(out);

    const real = findRealMatchForSlot(slot, out, byFifa);
    const syntheticId = syntheticFixtureId(slot.fifa);
    const existingSyntheticIdx = out.findIndex(
      (m) => m.fixture_id === syntheticId
    );

    if (real) {
      if (existingSyntheticIdx !== -1) {
        out.splice(existingSyntheticIdx, 1);
        changed = true;
      }
      byFifa.set(slot.fifa, real);
      continue;
    }

    if (existingSyntheticIdx !== -1) {
      const refreshed = buildSyntheticMatch(slot, byFifa);
      const prev = out[existingSyntheticIdx]!;
      if (
        prev.home_team_id !== refreshed.home_team_id ||
        prev.away_team_id !== refreshed.away_team_id ||
        prev.home_team_name !== refreshed.home_team_name ||
        prev.away_team_name !== refreshed.away_team_name
      ) {
        out[existingSyntheticIdx] = {
          ...refreshed,
          channels: prev.channels ?? [],
        };
        changed = true;
      }
      continue;
    }

    if (findMatchCoveringFifa(slot.fifa, out, byFifa)) continue;

    out.push(buildSyntheticMatch(slot, byFifa));
    changed = true;
  }

  return changed ? out : matches;
}

/**
 * Acrescenta jogos eliminatórios oficiais em falta (oitavos → final) quando a
 * API ainda não os publicou. Preferem-se sempre fixtures reais aos sintéticos.
 */
export function appendScheduledKnockoutMatches(matches: Match[]): Match[] {
  let result = matches;

  result = mergeOfficialRound(result, OFFICIAL_R16, 8);
  result = mergeOfficialRound(result, OFFICIAL_QF, 8);
  result = mergeOfficialRound(result, OFFICIAL_SF, 4);
  result = mergeOfficialRound(result, OFFICIAL_THIRD, 2);
  result = mergeOfficialRound(result, OFFICIAL_FINAL, 2);
  result = dropCoveredSynthetics(result);
  result = dropUnmappedOfficialRoundMatches(result);

  if (result === matches) return matches;

  return [...result].sort(
    (a, b) =>
      new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
  );
}

/**
 * Mapa fixture_id → número FIFA (73–104) para eliminatórias alinhadas.
 * Usado no rodapé «Jogo N» em vez da ordem sequencial global.
 */
export function buildFifaNumberByFixtureId(
  matches: Match[]
): Map<number, number> {
  const byFifa = rebuildFifaMap(matches);
  const map = new Map<number, number>();

  for (const [fifa, match] of byFifa) {
    if (fifa >= 73) {
      map.set(match.fixture_id, fifa);
    }
  }

  for (const match of matches) {
    if (!isSyntheticFixture(match.fixture_id) || map.has(match.fixture_id)) {
      continue;
    }
    map.set(
      match.fixture_id,
      match.fixture_id - SYNTHETIC_FIXTURE_BASE
    );
  }

  return map;
}
