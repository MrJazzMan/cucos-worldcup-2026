"use client";

import { useState, type CSSProperties } from "react";
import { LivePulseDot } from "@/components/LivePulseDot";
import { MatchFavouriteToggle } from "@/components/match/MatchFavouriteToggle";
import { MatchChannels } from "@/components/match/MatchChannels";
import { MatchTeamsLayout } from "@/components/match/MatchTeamsLayout";
import { MatchVenue } from "@/components/match/MatchVenue";
import { useSettings } from "@/components/SettingsProvider";
import { useLiveMinute } from "@/lib/match-time";
import type { Match } from "@/types";

interface MatchCardProps {
  match: Match & { isFavourite?: boolean };
  loggedIn?: boolean;
  staggerIndex?: number;
  selectedDay?: string;
  showKickoffDate?: boolean;
}

export function MatchCard({
  match,
  loggedIn = false,
  staggerIndex,
  selectedDay,
  showKickoffDate,
}: MatchCardProps) {
  const { t } = useSettings();
  const [isFavourite, setIsFavourite] = useState(!!match.isFavourite);
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
      className={`match-card flex h-full flex-col ${
        staggerIndex !== undefined ? "animate-rise-sequence" : "animate-rise"
      } rounded-2xl border bg-surface ${
        isLive
          ? "match-card--live border-red-500/50 px-4 py-5 shadow-lg shadow-red-500/15 ring-1 ring-red-500/20"
          : isFavourite
            ? "match-card--favourite border-amber-500/60 px-4 py-5 shadow-sm ring-1 ring-amber-500/30"
            : "border-border-base px-4 py-5 shadow-sm"
      }`}
      style={
        staggerIndex !== undefined
          ? ({ "--stagger-index": staggerIndex } as CSSProperties)
          : undefined
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${badgeClass}`}
        >
          {isLive && <LivePulseDot />}
          {badgeText}
        </span>
        <MatchFavouriteToggle
          match={{ ...match, isFavourite }}
          loggedIn={loggedIn}
          onChange={setIsFavourite}
        />
      </div>

      <MatchTeamsLayout
        match={match}
        variant="card"
        liveMinute={liveMinute}
        selectedDay={selectedDay}
        showKickoffDate={showKickoffDate}
      />

      <div className="mt-4">
        <MatchVenue venue={match.venue} variant="card" />
      </div>

      <div className="mt-auto flex flex-col pt-4">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <MatchChannels
            channels={match.channels}
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
