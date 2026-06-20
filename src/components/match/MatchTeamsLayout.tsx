"use client";

import { KickoffTime, TeamName } from "@/components/Display";
import { MatchFinishedKickoff } from "@/components/match/MatchFinishedKickoff";
import { TeamFlag } from "@/components/TeamFlag";
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
    flag: 76,
    name: "text-sm font-bold leading-tight sm:text-base",
    score: "text-2xl",
    scoreDash: "text-lg",
    center: "w-20",
    gap: "gap-3",
  },
  featured: {
    flag: 104,
    name: "text-base font-bold leading-tight sm:text-lg",
    score: "text-4xl",
    scoreDash: "text-2xl",
    center: "w-28",
    gap: "gap-4",
  },
} as const;

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

  return (
    <div className={`flex items-center justify-between ${sizes.gap}`}>
      <div className="flex min-w-0 flex-1 flex-col items-center gap-2.5 text-center">
        <TeamFlag
          name={match.home_team_name}
          teamId={match.home_team_id}
          size={sizes.flag}
        />
        <p className={`${sizes.name} text-foreground`}>
          <TeamName name={match.home_team_name} />
        </p>
      </div>

      <div
        className={`flex ${sizes.center} shrink-0 flex-col items-center justify-center gap-1`}
      >
        {(isLive || isFinished) && match.home_score != null ? (
          <p
            className={`flex items-center gap-1.5 font-bold tabular-nums ${sizes.score} ${
              isLive ? "text-red-500" : "text-foreground"
            }`}
          >
            <span>{match.home_score}</span>
            <span className={`${sizes.scoreDash} font-light opacity-40`}>–</span>
            <span>{match.away_score}</span>
          </p>
        ) : (
          <p
            className={`font-semibold tabular-nums text-muted ${sizes.score}`}
          >
            <KickoffTime utc={match.kickoff_utc} />
          </p>
        )}
        {isLive && liveMinute != null && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-red-500">
            {liveMinute}&apos;
          </span>
        )}
        {isFinished && (
          <MatchFinishedKickoff
            kickoffUtc={match.kickoff_utc}
            selectedDay={selectedDay}
            showKickoffDate={showKickoffDate}
            variant={variant}
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-center gap-2.5 text-center">
        <TeamFlag
          name={match.away_team_name}
          teamId={match.away_team_id}
          size={sizes.flag}
        />
        <p className={`${sizes.name} text-foreground`}>
          <TeamName name={match.away_team_name} />
        </p>
      </div>
    </div>
  );
}
