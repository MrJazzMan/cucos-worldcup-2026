import { addDays, startOfDay } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { TIMEZONE } from "@/lib/timezone";
import type { Match } from "@/types";

function todayStr(): string {
  return formatInTimeZone(startOfDay(new Date()), TIMEZONE, "yyyy-MM-dd");
}

function dateOffsetStr(days: number): string {
  return formatInTimeZone(
    addDays(startOfDay(new Date()), days),
    TIMEZONE,
    "yyyy-MM-dd"
  );
}

function kickoff(date: string, hour: number, minute = 0): string {
  const m = String(minute).padStart(2, "0");
  // Verão em Portugal: UTC+1
  return `${date}T${String(hour - 1).padStart(2, "0")}:${m}:00.000Z`;
}

const today = todayStr();
const yesterday = dateOffsetStr(-1);
const tomorrow = dateOffsetStr(1);

export const MOCK_MATCHES: Omit<Match, "channels">[] = [
  {
    fixture_id: 1001,
    kickoff_utc: kickoff(yesterday, 20, 0),
    match_date: yesterday,
    home_team_id: 27,
    home_team_name: "Portugal",
    home_team_logo: "https://media.api-sports.io/football/teams/27.png",
    away_team_id: 801,
    away_team_name: "DR Congo",
    away_team_logo: null,
    home_score: 2,
    away_score: 1,
    status: "finished",
    minute: null,
    round: "Group Stage - 1",
    group_name: "Grupo K",
    venue: "MetLife Stadium",
  },
  {
    fixture_id: 1002,
    kickoff_utc: kickoff(today, 14, 0),
    match_date: today,
    home_team_id: 10,
    home_team_name: "Brasil",
    home_team_logo: "https://media.api-sports.io/football/teams/10.png",
    away_team_id: 15,
    away_team_name: "Marrocos",
    away_team_logo: null,
    home_score: 1,
    away_score: 1,
    status: "live",
    minute: 67,
    round: "Group Stage - 2",
    group_name: "Grupo C",
    venue: "Hard Rock Stadium",
  },
  {
    fixture_id: 1003,
    kickoff_utc: kickoff(today, 18, 0),
    match_date: today,
    home_team_id: 27,
    home_team_name: "Portugal",
    home_team_logo: "https://media.api-sports.io/football/teams/27.png",
    away_team_id: 802,
    away_team_name: "Uzbequistão",
    away_team_logo: null,
    home_score: null,
    away_score: null,
    status: "upcoming",
    minute: null,
    round: "Group Stage - 2",
    group_name: "Grupo K",
    venue: "NRG Stadium",
  },
  {
    fixture_id: 1004,
    kickoff_utc: kickoff(today, 21, 0),
    match_date: today,
    home_team_id: 1,
    home_team_name: "Argentina",
    home_team_logo: "https://media.api-sports.io/football/teams/26.png",
    away_team_id: 20,
    away_team_name: "México",
    away_team_logo: null,
    home_score: null,
    away_score: null,
    status: "upcoming",
    minute: null,
    round: "Group Stage - 2",
    group_name: "Grupo D",
    venue: "SoFi Stadium",
  },
  {
    fixture_id: 1005,
    kickoff_utc: kickoff(tomorrow, 2, 30),
    match_date: tomorrow,
    home_team_id: 803,
    home_team_name: "Colômbia",
    home_team_logo: null,
    away_team_id: 27,
    away_team_name: "Portugal",
    away_team_logo: "https://media.api-sports.io/football/teams/27.png",
    home_score: null,
    away_score: null,
    status: "upcoming",
    minute: null,
    round: "Group Stage - 3",
    group_name: "Grupo K",
    venue: "Levi's Stadium",
  },
];

export const MOCK_BROADCASTS: Record<number, string[]> = {
  1001: ["RTP1"],
  1003: ["RTP1"],
  1005: ["RTP1", "Sport TV"],
  1002: ["SIC"],
  1004: ["TVI"],
};

export function getMockMatchesForDate(date: string): Match[] {
  return MOCK_MATCHES.filter((m) => m.match_date === date).map((m) => ({
    ...m,
    channels: MOCK_BROADCASTS[m.fixture_id] ?? [],
  }));
}
