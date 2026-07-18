import type { Match, MatchGoalEvent } from "@/types";

/** Minuto a partir do qual eventos «Penalty» são grandes penalidades (não penálti de jogo). */
const SHOOTOUT_MINUTE = 120;

export type MatchWinnerSide = "home" | "away";

export type PenaltyShootoutResult = {
  homeScored: number;
  awayScored: number;
  winner: MatchWinnerSide;
};

function isPenaltyShootoutEvent(event: MatchGoalEvent): boolean {
  return (
    event.minute >= SHOOTOUT_MINUTE &&
    (event.detail === "Penalty" || event.detail === "Missed Penalty")
  );
}

/** Golo de jogo (90 min + prolongamento), exclui marcas da disputa de penáltis. */
export function isRegulationGoalEvent(event: MatchGoalEvent): boolean {
  if (event.detail === "Missed Penalty") return false;
  if (event.detail === "Penalty" && event.minute >= SHOOTOUT_MINUTE) {
    return false;
  }
  return (
    event.detail === "Normal Goal" ||
    event.detail === "Own Goal" ||
    event.detail === "Penalty" ||
    event.detail === "Free Kick"
  );
}

export function regulationGoalsForTeam(
  events: MatchGoalEvent[] | undefined,
  teamId: number
): MatchGoalEvent[] {
  return (events ?? []).filter(
    (e) => e.team_id === teamId && isRegulationGoalEvent(e)
  );
}

export function regulationScoresFromEvents(
  events: MatchGoalEvent[] | undefined,
  homeTeamId: number,
  awayTeamId: number
): { home: number; away: number } {
  return {
    home: regulationGoalsForTeam(events, homeTeamId).length,
    away: regulationGoalsForTeam(events, awayTeamId).length,
  };
}

/** Marcadores em falta ou desfasados do placar (FT) — precisam de re-sync. */
export function needsGoalEventsResync(match: {
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_team_id: number;
  away_team_id: number;
  goal_events?: MatchGoalEvent[] | null;
}): boolean {
  if (match.status === "live") return true;

  if (match.status !== "finished") return false;

  const goals = match.goal_events ?? [];
  if (!goals.length) {
    return (match.home_score ?? 0) + (match.away_score ?? 0) > 0;
  }

  const fromEvents = regulationScoresFromEvents(
    goals,
    match.home_team_id,
    match.away_team_id
  );
  const home = match.home_score ?? 0;
  const away = match.away_score ?? 0;
  return fromEvents.home !== home || fromEvents.away !== away;
}

export type MatchGoalDisplay = {
  scores: { home: number; away: number };
  homeGoals: MatchGoalEvent[];
  awayGoals: MatchGoalEvent[];
};

/**
 * Placar e marcadores a partir da mesma lógica — evita 2-0 com 3 autores ou 0-0 com golo listado.
 */
export function getMatchGoalDisplay(
  match: Pick<
    Match,
    | "status"
    | "home_team_id"
    | "away_team_id"
    | "home_score"
    | "away_score"
    | "goal_events"
  >
): MatchGoalDisplay {
  const homeGoals = regulationGoalsForTeam(
    match.goal_events,
    match.home_team_id
  );
  const awayGoals = regulationGoalsForTeam(
    match.goal_events,
    match.away_team_id
  );
  const fromApi = {
    home: match.home_score ?? 0,
    away: match.away_score ?? 0,
  };
  const fromEvents = {
    home: homeGoals.length,
    away: awayGoals.length,
  };
  const hasEvents = fromEvents.home + fromEvents.away > 0;

  if (!hasEvents) {
    return { scores: fromApi, homeGoals: [], awayGoals: [] };
  }

  if (match.status === "live") {
    return {
      scores: {
        home: Math.max(fromApi.home, fromEvents.home),
        away: Math.max(fromApi.away, fromEvents.away),
      },
      homeGoals,
      awayGoals,
    };
  }

  if (
    fromApi.home === fromEvents.home &&
    fromApi.away === fromEvents.away
  ) {
    return { scores: fromApi, homeGoals, awayGoals };
  }

  return { scores: fromApi, homeGoals: [], awayGoals: [] };
}

/** @deprecated Prefer getMatchGoalDisplay for UI — keeps score and scorers in sync. */
export function getRegulationScores(
  match: Pick<
    Match,
    | "status"
    | "home_team_id"
    | "away_team_id"
    | "home_score"
    | "away_score"
    | "goal_events"
  >
): { home: number; away: number } {
  return getMatchGoalDisplay(match).scores;
}

export function getPenaltyShootoutResult(
  match: Pick<
    Match,
    "home_score" | "away_score" | "home_team_id" | "away_team_id" | "goal_events"
  >
): PenaltyShootoutResult | null {
  const home = match.home_score ?? 0;
  const away = match.away_score ?? 0;
  if (home !== away) return null;

  const shootout = (match.goal_events ?? []).filter(isPenaltyShootoutEvent);
  if (!shootout.length) return null;

  let homeScored = 0;
  let awayScored = 0;

  for (const event of shootout) {
    if (event.detail !== "Penalty") continue;
    if (event.team_id === match.home_team_id) homeScored++;
    else if (event.team_id === match.away_team_id) awayScored++;
  }

  if (homeScored === awayScored) return null;

  return {
    homeScored,
    awayScored,
    winner: homeScored > awayScored ? "home" : "away",
  };
}

/** Vencedor do jogo terminado (inclui desempate por penáltis). */
export function getMatchWinnerSide(
  match: Pick<
    Match,
    | "status"
    | "home_score"
    | "away_score"
    | "home_team_id"
    | "away_team_id"
    | "goal_events"
    | "home_pen"
    | "away_pen"
  >
): MatchWinnerSide | null {
  if (match.status !== "finished") return null;

  const home = match.home_score ?? 0;
  const away = match.away_score ?? 0;
  if (home > away) return "home";
  if (away > home) return "away";

  const fromEvents = getPenaltyShootoutResult(match)?.winner;
  if (fromEvents) return fromEvents;

  const homePen = match.home_pen ?? null;
  const awayPen = match.away_pen ?? null;
  if (homePen != null && awayPen != null && homePen !== awayPen) {
    return homePen > awayPen ? "home" : "away";
  }

  return null;
}

export function getWinnerTeamId(
  match: Pick<
    Match,
    | "status"
    | "home_score"
    | "away_score"
    | "home_team_id"
    | "away_team_id"
    | "goal_events"
    | "home_pen"
    | "away_pen"
  >
): number | null {
  const side = getMatchWinnerSide(match);
  if (side == null) return null;
  return side === "home" ? match.home_team_id : match.away_team_id;
}

/** Perdedor do jogo terminado (inclui desempate por penáltis). */
export function getLoserTeamId(
  match: Pick<
    Match,
    | "status"
    | "home_score"
    | "away_score"
    | "home_team_id"
    | "away_team_id"
    | "goal_events"
    | "home_pen"
    | "away_pen"
  >
): number | null {
  const side = getMatchWinnerSide(match);
  if (side == null) return null;
  return side === "home" ? match.away_team_id : match.home_team_id;
}
