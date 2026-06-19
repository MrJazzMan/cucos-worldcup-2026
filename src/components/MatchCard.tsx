"use client";

import { MatchChannels } from "@/components/match/MatchChannels";
import { MatchTeamsLayout } from "@/components/match/MatchTeamsLayout";
import { MatchVenue } from "@/components/match/MatchVenue";
import { useSettings } from "@/components/SettingsProvider";
import { useLiveMinute } from "@/lib/match-time";
import type { Match } from "@/types";

interface MatchCardProps {
  match: Match & { isFavourite?: boolean };
  canViewChannels?: boolean;
}

export function MatchCard({ match, canViewChannels = false }: MatchCardProps) {
  const { t } = useSettings();
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const liveMinute = useLiveMinute(isLive, match.minute);

  const badgeClass = isLive
    ? "bg-red-500 text-white"
    : isFinished
      ? "bg-zinc-400 text-white"
      : "bg-emerald-500/90 text-white";

  const badgeText = isLive
    ? liveMinute != null
      ? `${t("status.live")} ${liveMinute}'`
      : t("status.live")
    : isFinished
      ? t("status.finished")
      : t("status.upcoming");

  return (
    <article
      className={`flex h-full flex-col animate-rise rounded-2xl border bg-surface transition-all ${
        isLive
          ? "border-red-500/50 px-4 py-5 shadow-lg shadow-red-500/15 ring-1 ring-red-500/20 hover:shadow-xl hover:shadow-red-500/20"
          : match.isFavourite
            ? "border-amber-500/60 px-4 py-5 shadow-sm ring-1 ring-amber-500/30 hover:shadow-md"
            : "border-border-base px-4 py-5 shadow-sm hover:shadow-md"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${badgeClass}`}
        >
          {isLive && (
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
          )}
          {badgeText}
        </span>
        <span
          className={`text-base ${match.isFavourite ? "text-amber-400" : "text-muted/40"}`}
          aria-hidden
        >
          {match.isFavourite ? "★" : "☆"}
        </span>
      </div>

      <MatchTeamsLayout
        match={match}
        variant="card"
        liveMinute={liveMinute}
      />

      <div className="mt-4">
        <MatchVenue venue={match.venue} />
      </div>

      <div className="mt-auto flex flex-col pt-4">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <MatchChannels
            channels={match.channels}
            canViewChannels={canViewChannels}
            emptyLabel={t("card.channelTBC")}
          />
        </div>

        {match.group_name && (
          <p className="mt-2 text-center text-[10px] uppercase tracking-wide text-muted">
            {match.group_name}
          </p>
        )}
      </div>
    </article>
  );
}
