import type { MatchStatus } from "@/types";

const API_BASE = "https://v3.football.api-sports.io";

interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      elapsed: number | null;
    };
    venue: { name: string | null } | null;
  };
  league: {
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

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "x-apisports-key": getApiKey(),
    },
    next: { revalidate: 0 },
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
  const matchDate = kickoffUtc.slice(0, 10);
  const status = mapApiStatus(fixture.fixture.status.short);

  return {
    fixture_id: fixture.fixture.id,
    kickoff_utc: kickoffUtc,
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
      status === "live" ? fixture.fixture.status.elapsed : null,
    round: fixture.league.round,
    group_name: extractGroupName(fixture.league.round),
    venue: fixture.fixture.venue?.name ?? null,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchAllFixtures() {
  return apiFetch<ApiFixture[]>(
    "/fixtures?league=1&season=2026&timezone=UTC"
  );
}

export async function fetchLiveFixtures() {
  const all = await apiFetch<ApiFixture[]>("/fixtures?live=all");
  return all.filter((f) => {
    const round = f.league.round.toLowerCase();
    return (
      round.includes("group") ||
      round.includes("round of") ||
      round.includes("final") ||
      round.includes("3rd")
    );
  });
}

export async function fetchStandings() {
  return apiFetch<
    {
      league: {
        standings: {
          rank: number;
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
  >("/standings?league=1&season=2026");
}

export async function fetchRounds() {
  return apiFetch<string[]>("/fixtures/rounds?league=1&season=2026");
}

export async function fetchFixturesByRound(round: string) {
  const encoded = encodeURIComponent(round);
  return apiFetch<ApiFixture[]>(
    `/fixtures?league=1&season=2026&round=${encoded}`
  );
}

export async function fetchTeams() {
  return apiFetch<
    { team: { id: number; name: string; logo: string } }[]
  >("/teams?league=1&season=2026");
}
