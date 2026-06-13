export type MatchStatus = "upcoming" | "live" | "finished";

export type DayOffset = -1 | 0 | 1;

export interface Match {
  fixture_id: number;
  kickoff_utc: string;
  match_date: string;
  home_team_id: number;
  home_team_name: string;
  home_team_logo: string | null;
  away_team_id: number;
  away_team_name: string;
  away_team_logo: string | null;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  minute: number | null;
  round: string | null;
  group_name: string | null;
  venue: string | null;
  channels?: string[];
}

export interface Broadcast {
  fixture_id: number;
  channels: string[];
  notes: string | null;
}

export interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface FavouriteTeam {
  id: number;
  user_id: string;
  team_id: number;
  team_name: string;
}

export interface NotificationPrefs {
  user_id: string;
  before_24h: boolean;
  before_1h: boolean;
  before_15m: boolean;
  match_started: boolean;
  final_result: boolean;
}

export interface PushSubscription {
  id: number;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface StandingRow {
  rank: number;
  team_id: number;
  team_name: string;
  team_logo: string | null;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  form: string | null;
}

export interface GroupStanding {
  group_name: string;
  rows: StandingRow[];
}

export interface KnockoutRound {
  round: string;
  matches: Match[];
}

export type NotificationType =
  | "before_24h"
  | "before_1h"
  | "before_15m"
  | "match_started"
  | "final_result";

export interface TeamOption {
  team_id: number;
  team_name: string;
  team_logo: string | null;
}
