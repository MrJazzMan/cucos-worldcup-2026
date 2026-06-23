"use client";

import type { CSSProperties } from "react";
import { LivePulseDot } from "@/components/LivePulseDot";
import { MatchFavouriteToggle } from "@/components/match/MatchFavouriteToggle";
import { MatchChannels } from "@/components/match/MatchChannels";
import { MatchTeamsLayout } from "@/components/match/MatchTeamsLayout";
import { MatchVenue } from "@/components/match/MatchVenue";
import { useSettings } from "@/components/SettingsProvider";
import {
  formatKickoffCountdown,
  useKickoffCountdown,
  useLiveMinute,
} from "@/lib/match-time";
import type { Match } from "@/types";

interface FeaturedMatchProps {
  match: Match & { isFavourite?: boolean };
  loggedIn?: boolean;
  staggerIndex?: number;
  selectedDay?: string;
  showKickoffDate?: boolean;
}

export function FeaturedMatch({
  match,
  loggedIn = false,
  staggerIndex,
  selectedDay,
  showKickoffDate,
}: FeaturedMatchProps) {
  const { t } = useSettings();
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const isUpcoming = match.status === "upcoming";
  const liveMinute = useLiveMinute(isLive, match.minute);
  const countdown = useKickoffCountdown(match.kickoff_utc, isUpcoming);

  const statusLabel = isLive
    ? t("featured.live")
    : isFinished
      ? t("featured.final")
      : countdown
        ? formatKickoffCountdown(countdown, t)
        : t("status.upcoming");

  const statusClass = isLive
    ? "bg-red-500 text-white"
    : isFinished
      ? "bg-zinc-500 text-white"
      : "bg-accent text-white";

  return (
    <article
      className={`${
        staggerIndex !== undefined ? "animate-rise-sequence" : "animate-rise"
      } rounded-2xl border-2 border-accent bg-surface px-5 py-6 shadow-lg shadow-accent/10 sm:px-8 sm:py-8`}
      style={
        staggerIndex !== undefined
          ? ({ "--stagger-index": staggerIndex } as CSSProperties)
          : undefined
      }
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusClass}`}
        >
          {isLive && <LivePulseDot />}
          {statusLabel}
        </span>
        <MatchFavouriteToggle match={match} loggedIn={loggedIn} size="md" />
      </div>

      <MatchTeamsLayout
        match={match}
        variant="featured"
        liveMinute={liveMinute}
        selectedDay={selectedDay}
        showKickoffDate={showKickoffDate}
      />

      <div className="mt-5">
        <MatchVenue venue={match.venue} variant="featured" />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
        <MatchChannels
          channels={match.channels}
          emptyLabel={t("card.channelTBC")}
          loggedIn={loggedIn}
          lockedLabel={t("card.channelsSignIn")}
        />
      </div>

      {match.group_name && (
        <p className="mt-3 text-center text-[10px] uppercase tracking-wide text-muted">
          {match.group_name}
        </p>
      )}
    </article>
  );
}
