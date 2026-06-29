import {
  feederPlaceholderName,
  syntheticFixtureId,
} from "@/lib/feeder-teams";
import { knockoutRoundKey } from "@/lib/knockout-bracket";
import { FIFA_MATCH_NUMBERS } from "@/lib/knockout-fifa-order";
import { formatMatchDate } from "@/lib/timezone";
import type { Match } from "@/types";

type ScheduledKnockout = {
  fifa: number;
  homeFeeder: number;
  awayFeeder: number;
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

function buildFifaR32Map(matches: Match[]): Map<number, Match> {
  const r32 = matches
    .filter((m) => knockoutRoundKey(m.round) === "r32")
    .sort(
      (a, b) =>
        new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
    );

  const map = new Map<number, Match>();
  for (let i = 0; i < r32.length && i < FIFA_MATCH_NUMBERS.r32.length; i++) {
    map.set(FIFA_MATCH_NUMBERS.r32[i]!, r32[i]!);
  }
  return map;
}

function knockoutWinner(
  match: Match
): { team_id: number; team_name: string; team_logo: string | null } | null {
  if (match.status !== "finished") return null;
  const home = match.home_score ?? 0;
  const away = match.away_score ?? 0;
  if (home > away) {
    return {
      team_id: match.home_team_id,
      team_name: match.home_team_name,
      team_logo: match.home_team_logo,
    };
  }
  if (away > home) {
    return {
      team_id: match.away_team_id,
      team_name: match.away_team_name,
      team_logo: match.away_team_logo,
    };
  }
  return null;
}

type FeederSide = {
  team_id: number;
  team_name: string;
  team_logo: string | null;
};

function resolveFeederSide(
  fifaMatchNumber: number,
  r32Map: Map<number, Match>
): FeederSide {
  const feeder = r32Map.get(fifaMatchNumber);
  if (feeder) {
    const winner = knockoutWinner(feeder);
    if (winner) return winner;
  }

  return {
    team_id: syntheticFixtureId(fifaMatchNumber),
    team_name: feederPlaceholderName(fifaMatchNumber),
    team_logo: null,
  };
}

function buildScheduledR16(matches: Match[]): Match[] {
  const r32Map = buildFifaR32Map(matches);
  if (r32Map.size < 8) return [];

  return OFFICIAL_R16.map((slot) => {
    const home = resolveFeederSide(slot.homeFeeder, r32Map);
    const away = resolveFeederSide(slot.awayFeeder, r32Map);

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
      status: "upcoming" as const,
      minute: null,
      round: slot.round,
      group_name: null,
      venue: slot.venue,
      channels: [],
    };
  });
}

/** Acrescenta jogos eliminatórios oficiais quando a API ainda não os publicou. */
export function appendScheduledKnockoutMatches(matches: Match[]): Match[] {
  if (matches.some((m) => knockoutRoundKey(m.round) === "r16")) {
    return matches;
  }

  const scheduled = buildScheduledR16(matches);
  if (!scheduled.length) return matches;

  return [...matches, ...scheduled].sort(
    (a, b) =>
      new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
  );
}
