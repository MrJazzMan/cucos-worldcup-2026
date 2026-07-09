"use client";

import { useState } from "react";
import { TeamName } from "@/components/Display";
import { LivePulseDot } from "@/components/LivePulseDot";
import { MatchChannels } from "@/components/match/MatchChannels";
import { MatchMetaFooter } from "@/components/match/MatchMetaFooter";
import { MatchFavouriteToggle } from "@/components/match/MatchFavouriteToggle";
import { MatchTeamScorers } from "@/components/match/MatchTeamScorers";
import { TeamFlag } from "@/components/TeamFlag";
import { useSettings } from "@/components/SettingsProvider";
import { timeInTz } from "@/lib/datetime";
import {
  getMatchWinnerSide,
  getPenaltyShootoutResult,
  getMatchGoalDisplay,
} from "@/lib/match-result";
import { useLiveMinute } from "@/lib/match-time";
import type { Match } from "@/types";

interface ScheduleMatchCardProps {
  match: Match & { isFavourite?: boolean };
  loggedIn?: boolean;
  matchNumber?: number;
}

export function ScheduleMatchCard({
  match,
  loggedIn = false,
  matchNumber,
}: ScheduleMatchCardProps) {
  const { t, tz } = useSettings();
  const [isFavourite, setIsFavourite] = useState(!!match.isFavourite);
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const showScoreboard = isLive || isFinished;
  const liveMinute = useLiveMinute(isLive, match.minute);
  const time = timeInTz(match.kickoff_utc, tz);
  const winner = isFinished ? getMatchWinnerSide(match) : null;
  const shootout = isFinished ? getPenaltyShootoutResult(match) : null;
  const { scores, homeGoals, awayGoals } = getMatchGoalDisplay(match);

  const homeWon = winner === "home";
  const awayWon = winner === "away";
  const scoreClass = (won: boolean) =>
    isLive
      ? "text-red-500"
      : won
        ? "text-foreground font-extrabold"
        : winner
          ? "text-muted/50 font-medium"
          : "text-foreground";
  const nameClass = (won: boolean) =>
    won
      ? "font-bold text-foreground"
      : winner
        ? "font-medium text-muted"
        : "font-semibold text-foreground";

  return (
    <article
      className={`relative rounded-2xl border bg-surface px-4 py-4 shadow-sm ${
        isLive
          ? "border-red-500/50 ring-1 ring-red-500/20"
          : isFavourite
            ? "border-amber-500/60 ring-1 ring-amber-500/30"
            : "border-border-base"
      }`}
    >
      <div className="absolute right-3 top-3">
        <MatchFavouriteToggle
          match={{ ...match, isFavourite }}
          loggedIn={loggedIn}
          onChange={setIsFavourite}
        />
      </div>

      <div className="flex items-start justify-center gap-x-3 gap-y-2 px-6">
        <div className="flex min-w-0 flex-1 flex-col items-end">
          <div className="flex items-center gap-2">
            <span className={`truncate text-right text-sm sm:text-base ${nameClass(homeWon)}`}>
              <TeamName name={match.home_team_name} />
            </span>
            <TeamFlag
              name={match.home_team_name}
              teamId={match.home_team_id}
              size={28}
            />
          </div>
          {showScoreboard && (
            <MatchTeamScorers
              goals={homeGoals}
              variant="schedule"
              align="end"
            />
          )}
        </div>

        <div className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center self-center">
          {showScoreboard ? (
            <div className="flex items-center gap-1.5 font-bold tabular-nums">
              <span className={`text-lg sm:text-xl ${scoreClass(homeWon)}`}>
                {scores.home}
              </span>
              <span className="flex min-w-[2.75rem] flex-col items-center text-[10px] font-bold uppercase tracking-wide text-muted">
                {isLive ? (
                  <span className="inline-flex items-center gap-1 text-red-500">
                    <LivePulseDot size="sm" />
                    {liveMinute != null ? `${liveMinute}'` : t("status.live")}
                  </span>
                ) : (
                  <>
                    <span>{shootout ? t("status.penaltiesShort") : t("status.finished")}</span>
                    {shootout && (
                      <span className="text-[9px] font-semibold normal-case tracking-normal text-foreground/80">
                        {t("card.penaltiesResult")
                          .replace("{home}", String(shootout.homeScored))
                          .replace("{away}", String(shootout.awayScored))}
                      </span>
                    )}
                  </>
                )}
              </span>
              <span className={`text-lg sm:text-xl ${scoreClass(awayWon)}`}>
                {scores.away}
              </span>
            </div>
          ) : (
            <span className="text-lg font-semibold tabular-nums text-foreground sm:text-xl">
              {time}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-start">
          <div className="flex items-center gap-2">
            <TeamFlag
              name={match.away_team_name}
              teamId={match.away_team_id}
              size={28}
            />
            <span className={`truncate text-sm sm:text-base ${nameClass(awayWon)}`}>
              <TeamName name={match.away_team_name} />
            </span>
          </div>
          {showScoreboard && (
            <MatchTeamScorers
              goals={awayGoals}
              variant="schedule"
              align="start"
            />
          )}
        </div>
      </div>

      <MatchMetaFooter
        match={match}
        matchNumber={matchNumber}
        includeVenue
        className="mt-3 text-center text-[11px] text-muted"
      />

      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        <MatchChannels
          channels={match.channels}
          emptyLabel={t("card.channelTBC")}
          loggedIn={loggedIn}
        />
      </div>
    </article>
  );
}
