"use client";

import { KickoffTime, MatchCompactDate, TeamName } from "@/components/Display";
import { MatchFinishedKickoff } from "@/components/match/MatchFinishedKickoff";
import { MatchTeamScorers } from "@/components/match/MatchTeamScorers";
import { TeamFlag } from "@/components/TeamFlag";
import { useSettings } from "@/components/SettingsProvider";
import {
  getMatchWinnerSide,
  getPenaltyShootoutResult,
  getMatchGoalDisplay,
} from "@/lib/match-result";
import type { Match, MatchGoalEvent } from "@/types";

type MatchTeamsLayoutProps = {
  match: Match;
  variant: "card" | "featured";
  liveMinute?: number | null;
  selectedDay?: string;
  showKickoffDate?: boolean;
};

const SIZES = {
  card: {
    flag: 68,
    name: "text-sm font-bold leading-tight sm:text-base",
    score: "text-2xl",
    scoreDash: "text-lg",
    center: "w-[4.5rem]",
    gap: "gap-2.5",
    teamGap: "gap-1.5",
  },
  featured: {
    flag: 96,
    name: "text-base font-bold leading-tight sm:text-lg",
    score: "text-4xl",
    scoreDash: "text-2xl",
    center: "w-28",
    gap: "gap-4",
    teamGap: "gap-2",
  },
} as const;

function TeamColumn({
  teamId,
  teamName,
  goals,
  sizes,
  variant,
  won,
  lost,
}: {
  teamId: number;
  teamName: string;
  goals: MatchGoalEvent[];
  sizes: (typeof SIZES)[keyof typeof SIZES];
  variant: "card" | "featured";
  won?: boolean;
  lost?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col items-center text-center ${sizes.teamGap}`}
    >
      <TeamFlag name={teamName} teamId={teamId} size={sizes.flag} />
      <p
        className={`${sizes.name} ${
          won ? "font-extrabold text-foreground" : lost ? "text-muted" : "text-foreground"
        }`}
      >
        <TeamName name={teamName} />
      </p>
      <MatchTeamScorers goals={goals} variant={variant} />
    </div>
  );
}

export function MatchTeamsLayout({
  match,
  variant,
  liveMinute,
  selectedDay,
  showKickoffDate,
}: MatchTeamsLayoutProps) {
  const { t } = useSettings();
  const sizes = SIZES[variant];
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const showScoreboard = isLive || isFinished;
  const winner = isFinished ? getMatchWinnerSide(match) : null;
  const shootout = isFinished ? getPenaltyShootoutResult(match) : null;
  const { scores, homeGoals, awayGoals } = getMatchGoalDisplay(match);

  return (
    <div className={`flex items-start justify-between ${sizes.gap}`}>
      <TeamColumn
        teamId={match.home_team_id}
        teamName={match.home_team_name}
        goals={showScoreboard ? homeGoals : []}
        sizes={sizes}
        variant={variant}
        won={winner === "home"}
        lost={winner === "away"}
      />

      <div
        className={`flex ${sizes.center} shrink-0 flex-col items-center justify-center gap-1 self-center`}
      >
        {showScoreboard && (match.home_score != null || scores.home + scores.away > 0) ? (
          <div className="flex flex-col items-center gap-0.5">
            <p
              className={`flex items-center gap-1.5 font-bold tabular-nums ${sizes.score} ${
                isLive ? "text-red-500" : "text-foreground"
              }`}
            >
              <span
                className={
                  winner === "home"
                    ? "font-extrabold"
                    : winner === "away"
                      ? "font-medium opacity-45"
                      : ""
                }
              >
                {scores.home}
              </span>
              <span className={`${sizes.scoreDash} font-light opacity-40`}>–</span>
              <span
                className={
                  winner === "away"
                    ? "font-extrabold"
                    : winner === "home"
                      ? "font-medium opacity-45"
                      : ""
                }
              >
                {scores.away}
              </span>
            </p>
            {shootout && (
              <p className="text-[10px] font-semibold tabular-nums text-foreground/80">
                {t("card.penaltiesResult")
                  .replace("{home}", String(shootout.homeScored))
                  .replace("{away}", String(shootout.awayScored))}
              </p>
            )}
            <p className="text-[9px] font-medium tabular-nums text-muted/75">
              <MatchCompactDate utc={match.kickoff_utc} />
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <p
              className={`font-semibold tabular-nums text-muted ${sizes.score}`}
            >
              <KickoffTime utc={match.kickoff_utc} />
            </p>
            <p className="text-[9px] font-medium tabular-nums text-muted/75">
              <MatchCompactDate utc={match.kickoff_utc} />
            </p>
          </div>
        )}
        {isLive && liveMinute != null && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-red-500">
            {liveMinute}&apos;
          </span>
        )}
        {isLive && liveMinute == null && (
          <p className="text-[9px] font-medium tabular-nums text-muted/75">
            <MatchCompactDate utc={match.kickoff_utc} />
          </p>
        )}
        {isFinished && (
          <MatchFinishedKickoff
            kickoffUtc={match.kickoff_utc}
            variant={variant}
          />
        )}
      </div>

      <TeamColumn
        teamId={match.away_team_id}
        teamName={match.away_team_name}
        goals={showScoreboard ? awayGoals : []}
        sizes={sizes}
        variant={variant}
        won={winner === "away"}
        lost={winner === "home"}
      />
    </div>
  );
}
