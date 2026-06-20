import type { MatchStatus } from "@/types";
import { estimateFinishedUtcFromApi } from "@/lib/match-finish-time";
import { formatMatchDate } from "@/lib/timezone";
import { formatVenueField } from "@/lib/venues";
import { WC_LEAGUE_ID, isWorldCupRound } from "@/lib/world-cup";

const API_BASE = "https://v3.football.api-sports.io";

interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    periods?: {
      first: number | null;
      second: number | null;
    } | null;
    status: {
      short: string;
      elapsed: number | null;
    };
    venue: { name: string | null; city: string | null } | null;
  };
  league: {
    id: number;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

interface ApiResponse<T> {
  response: T;
  errors?: Record<string, string>;
}

function getApiKey(): string {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    throw new Error("API_FOOTBALL_KEY não configurada");
  }
  return key;
}

async function apiFetch<T>(
  path: string,
  options?: { revalidate?: number }
): Promise<T> {
  const revalidate = options?.revalidate ?? 300;
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "x-apisports-key": getApiKey(),
    },
    // Sync/cron: sem cache. Páginas de leitura: cache curto.
    ...(revalidate === 0
      ? { cache: "no-store" as const }
      : { next: { revalidate } }),
  });

  if (!res.ok) {
    throw new Error(`API-Football erro ${res.status}: ${path}`);
  }

  const data = (await res.json()) as ApiResponse<T>;
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`API-Football: ${JSON.stringify(data.errors)}`);
  }

  return data.response;
}

const LIVE_STATUSES = new Set([
  "1H",
  "2H",
  "HT",
  "ET",
  "BT",
  "P",
  "LIVE",
  "INT",
]);

const FINISHED_STATUSES = new Set([
  "FT",
  "AET",
  "PEN",
  "AWD",
  "WO",
  "ABD",
  "CANC",
]);

export function mapApiStatus(short: string): MatchStatus {
  if (LIVE_STATUSES.has(short)) return "live";
  if (FINISHED_STATUSES.has(short)) return "finished";
  return "upcoming";
}

function extractGroupName(round: string): string | null {
  const match = round.match(/Group\s+([A-L])/i);
  return match ? `Grupo ${match[1].toUpperCase()}` : null;
}

export function mapFixtureToMatch(fixture: ApiFixture) {
  const kickoffUtc = fixture.fixture.date;
  const matchDate = formatMatchDate(kickoffUtc);
  const status = mapApiStatus(fixture.fixture.status.short);
  const elapsed = fixture.fixture.status.elapsed;

  return {
    fixture_id: fixture.fixture.id,
    kickoff_utc: kickoffUtc,
    finished_utc:
      status === "finished"
        ? estimateFinishedUtcFromApi({
            date: kickoffUtc,
            status: fixture.fixture.status,
            periods: fixture.fixture.periods,
          })
        : null,
    match_date: matchDate,
    home_team_id: fixture.teams.home.id,
    home_team_name: fixture.teams.home.name,
    home_team_logo: fixture.teams.home.logo,
    away_team_id: fixture.teams.away.id,
    away_team_name: fixture.teams.away.name,
    away_team_logo: fixture.teams.away.logo,
    home_score: fixture.goals.home,
    away_score: fixture.goals.away,
    status,
    minute:
      status === "live" || status === "finished" ? elapsed : null,
    round: fixture.league.round,
    group_name: extractGroupName(fixture.league.round),
    venue: formatVenueField(fixture.fixture.venue),
    updated_at: new Date().toISOString(),
  };
}

export async function fetchAllFixtures() {
  return apiFetch<ApiFixture[]>(
    "/fixtures?league=1&season=2026&timezone=UTC",
    { revalidate: 0 }
  );
}

export async function fetchLiveFixtures() {
  const all = await apiFetch<ApiFixture[]>("/fixtures?live=all", {
    revalidate: 0,
  });
  return all.filter(
    (f) => f.league.id === WC_LEAGUE_ID && isWorldCupRound(f.league.round)
  );
}

export async function fetchStandings() {
  return apiFetch<
    {
      league: {
        standings: {
          rank: number;
          group: string;
          team: { id: number; name: string; logo: string };
          all: {
            played: number;
            win: number;
            draw: number;
            lose: number;
            goals: { for: number; against: number };
          };
          goalsDiff: number;
          points: number;
          form: string | null;
        }[][];
      };
    }[]
  >("/standings?league=1&season=2026", { revalidate: 300 });
}

export async function fetchRounds() {
  return apiFetch<string[]>("/fixtures/rounds?league=1&season=2026", {
    revalidate: 1800,
  });
}

export async function fetchFixturesByRound(round: string) {
  const encoded = encodeURIComponent(round);
  return apiFetch<ApiFixture[]>(
    `/fixtures?league=1&season=2026&round=${encoded}`,
    { revalidate: 300 }
  );
}

export async function fetchFixturesByDate(date: string) {
  return apiFetch<ApiFixture[]>(
    `/fixtures?league=1&season=2026&date=${encodeURIComponent(date)}&timezone=UTC`,
    { revalidate: 0 }
  );
}

export async function fetchFixturesByIds(ids: number[]) {
  if (!ids.length) return [];
  const chunk = ids.slice(0, 20).join("-");
  return apiFetch<ApiFixture[]>(`/fixtures?ids=${chunk}`, { revalidate: 0 });
}

export async function fetchTeams() {
  return apiFetch<
    { team: { id: number; name: string; logo: string } }[]
  >("/teams?league=1&season=2026", { revalidate: 3600 });
}

export interface ApiFixtureEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: { id: number | null; name: string | null };
  type: string;
  detail: string;
}

export async function fetchFixtureEvents(fixtureId: number) {
  return apiFetch<ApiFixtureEvent[]>(
    `/fixtures/events?fixture=${fixtureId}`,
    { revalidate: 0 }
  );
}
