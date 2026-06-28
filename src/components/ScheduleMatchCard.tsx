"use client";

import { useState } from "react";
import { TeamName } from "@/components/Display";
import { LivePulseDot } from "@/components/LivePulseDot";
import { MatchChannels } from "@/components/match/MatchChannels";
import { MatchMetaFooter } from "@/components/match/MatchMetaFooter";
import { MatchFavouriteToggle } from "@/components/match/MatchFavouriteToggle";
import { TeamFlag } from "@/components/TeamFlag";
import { useSettings } from "@/components/SettingsProvider";
import { timeInTz } from "@/lib/datetime";
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
  const liveMinute = useLiveMinute(isLive, match.minute);
  const time = timeInTz(match.kickoff_utc, tz);

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

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground sm:text-base">
            <TeamName name={match.home_team_name} />
          </span>
          <TeamFlag
            name={match.home_team_name}
            teamId={match.home_team_id}
            size={28}
          />
        </div>

        <div className="flex min-w-[4.5rem] flex-col items-center justify-center">
          {isLive || isFinished ? (
            <div className="flex items-center gap-1.5 font-bold tabular-nums">
              <span
                className={`text-lg sm:text-xl ${
                  isLive ? "text-red-500" : "text-foreground"
                }`}
              >
                {match.home_score ?? 0}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted">
                {isLive ? (
                  <span className="inline-flex items-center gap-1 text-red-500">
                    <LivePulseDot size="sm" />
                    {liveMinute != null ? `${liveMinute}'` : t("status.live")}
                  </span>
                ) : (
                  t("status.finished")
                )}
              </span>
              <span
                className={`text-lg sm:text-xl ${
                  isLive ? "text-red-500" : "text-foreground"
                }`}
              >
                {match.away_score ?? 0}
              </span>
            </div>
          ) : (
            <span className="text-lg font-semibold tabular-nums text-foreground sm:text-xl">
              {time}
            </span>
          )}
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <TeamFlag
            name={match.away_team_name}
            teamId={match.away_team_id}
            size={28}
          />
          <span className="truncate text-sm font-semibold text-foreground sm:text-base">
            <TeamName name={match.away_team_name} />
          </span>
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
