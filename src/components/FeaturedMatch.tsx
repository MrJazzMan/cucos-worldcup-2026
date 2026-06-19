"use client";

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
  canViewChannels?: boolean;
}

export function FeaturedMatch({
  match,
  canViewChannels = false,
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
    <article className="animate-rise rounded-2xl border-2 border-accent bg-surface px-5 py-6 shadow-lg shadow-accent/10 sm:px-8 sm:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusClass}`}
        >
          {isLive && (
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
          )}
          {statusLabel}
        </span>
        <span
          className={`ml-auto text-lg ${match.isFavourite ? "text-amber-400" : "text-muted/30"}`}
          aria-hidden
        >
          {match.isFavourite ? "★" : "☆"}
        </span>
      </div>

      <MatchTeamsLayout
        match={match}
        variant="featured"
        liveMinute={liveMinute}
      />

      <div className="mt-5">
        <MatchVenue venue={match.venue} />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
        <MatchChannels
          channels={match.channels}
          canViewChannels={canViewChannels}
          emptyLabel={t("card.channelTBC")}
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
