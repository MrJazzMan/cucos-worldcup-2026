"use client";

import { KickoffTime, MatchCompactDate, TeamName } from "@/components/Display";
import { MatchFinishedKickoff } from "@/components/match/MatchFinishedKickoff";
import { MatchTeamScorers } from "@/components/match/MatchTeamScorers";
import { TeamFlag } from "@/components/TeamFlag";
import { goalsForTeam } from "@/lib/match-events";
import type { Match } from "@/types";

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
}: {
  teamId: number;
  teamName: string;
  goals: ReturnType<typeof goalsForTeam>;
  sizes: (typeof SIZES)[keyof typeof SIZES];
  variant: "card" | "featured";
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col items-center text-center ${sizes.teamGap}`}
    >
      <TeamFlag name={teamName} teamId={teamId} size={sizes.flag} />
      <p className={`${sizes.name} text-foreground`}>
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
  const sizes = SIZES[variant];
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const showScoreboard = isLive || isFinished;
  const homeGoals = goalsForTeam(match.goal_events, match.home_team_id);
  const awayGoals = goalsForTeam(match.goal_events, match.away_team_id);

  return (
    <div className={`flex items-start justify-between ${sizes.gap}`}>
      <TeamColumn
        teamId={match.home_team_id}
        teamName={match.home_team_name}
        goals={showScoreboard ? homeGoals : []}
        sizes={sizes}
        variant={variant}
      />

      <div
        className={`flex ${sizes.center} shrink-0 flex-col items-center justify-center gap-1 self-center`}
      >
        {showScoreboard && match.home_score != null ? (
          <div className="flex flex-col items-center gap-0.5">
            <p
              className={`flex items-center gap-1.5 font-bold tabular-nums ${sizes.score} ${
                isLive ? "text-red-500" : "text-foreground"
              }`}
            >
              <span>{match.home_score}</span>
              <span className={`${sizes.scoreDash} font-light opacity-40`}>–</span>
              <span>{match.away_score}</span>
            </p>
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
      />
    </div>
  );
}
