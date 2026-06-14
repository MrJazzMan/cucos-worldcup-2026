"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TeamFlag } from "@/components/TeamFlag";
import { KickoffTime, TeamName, teamLabel } from "@/components/Display";
import { useSettings } from "@/components/SettingsProvider";
import { getChannelHref } from "@/lib/channels";
import { parseVenue } from "@/lib/venues";
import type { Match } from "@/types";

interface MatchCardProps {
  match: Match & { isFavourite?: boolean };
}

function countdownLabel(
  kickoffUtc: string,
  t: (key: string) => string
): string | null {
  const diff = new Date(kickoffUtc).getTime() - Date.now();
  if (diff <= 0 || diff > 12 * 60 * 60 * 1000) return null;
  const minutes = Math.ceil(diff / 60_000);
  if (minutes < 60) {
    return t("status.inMinutes").replace("{n}", String(minutes));
  }
  const hours = Math.ceil(diff / 3_600_000);
  return t("status.inHours").replace("{n}", String(hours));
}

/** Minuto ao vivo: base da API + incremento local entre refreshes. */
function useLiveMinute(
  isLive: boolean,
  serverMinute: number | null
): number | null {
  const syncedAt = useRef(Date.now());
  const [elapsedMin, setElapsedMin] = useState(0);

  useEffect(() => {
    syncedAt.current = Date.now();
    setElapsedMin(0);
  }, [serverMinute]);

  useEffect(() => {
    if (!isLive || serverMinute == null) return;
    const id = setInterval(() => {
      setElapsedMin(Math.floor((Date.now() - syncedAt.current) / 60_000));
    }, 30_000);
    return () => clearInterval(id);
  }, [isLive, serverMinute]);

  if (!isLive || serverMinute == null) return serverMinute;
  return serverMinute + elapsedMin;
}

function channelBadgeClass(channel: string) {
  const upper = channel.toUpperCase();

  if (upper.startsWith("RTP")) {
    return "inline-flex items-center rounded-lg bg-[#1f43ff] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.2)]";
  }

  if (upper.includes("SPORT TV")) {
    return "inline-flex items-center rounded-lg border border-[#111827] bg-[#07090f] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#ffd230]";
  }

  return "inline-flex items-center rounded-lg bg-zinc-900 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white";
}

export function MatchCard({ match }: MatchCardProps) {
  const { t, lang } = useSettings();
  const [now, setNow] = useState(() => Date.now());

  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const liveMinute = useLiveMinute(isLive, match.minute);
  const homeLabel = teamLabel(match.home_team_name, lang);
  const awayLabel = teamLabel(match.away_team_name, lang);
  const venue = parseVenue(match.venue);
  const stadium = venue.stadium?.trim() ?? null;
  const cityDisplay = venue.city ?? null;
  const cityFlag = venue.countryFlag ?? null;

  useEffect(() => {
    if (match.status !== "upcoming") return;
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [match.status]);

  const countdown = useMemo(
    () =>
      match.status === "upcoming"
        ? countdownLabel(match.kickoff_utc, t)
        : null,
    [match.status, match.kickoff_utc, t, now]
  );

  const badgeClass = isLive
    ? "bg-red-500 text-white"
    : isFinished
      ? "bg-zinc-400 text-white"
      : "bg-emerald-500 text-white";

  const badgeText = isLive
    ? liveMinute != null
      ? `${t("status.live")} ${liveMinute}'`
      : t("status.live")
    : countdown ?? t(`status.${match.status}`);

  return (
    <article
      className={`animate-rise rounded-2xl border bg-surface transition-all ${
        isLive
          ? "border-red-500/50 px-4 py-6 shadow-lg shadow-red-500/15 ring-1 ring-red-500/20 hover:shadow-xl hover:shadow-red-500/20"
          : match.isFavourite
            ? "border-amber-500/60 px-4 py-5 shadow-sm ring-1 ring-amber-500/30 hover:shadow-md"
            : "border-border-base px-4 py-5 shadow-sm hover:shadow-md"
      }`}
    >
      {/* Topo: estado + favorito */}
      <div className="mb-4 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${badgeClass}`}
        >
          {!isLive && !isFinished && <span>🕐</span>}
          {isLive && (
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
          )}
          {badgeText}
        </span>
        <span
          className={`text-lg ${match.isFavourite ? "text-amber-400" : "text-muted/40"}`}
          aria-hidden
        >
          {match.isFavourite ? "★" : "☆"}
        </span>
      </div>

      {/* Equipas + centro */}
      <div className="flex items-center justify-between gap-2">
        {/* Casa */}
        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          <TeamFlag name={homeLabel} logo={match.home_team_logo} size={48} />
          <p className="text-sm font-bold leading-tight text-foreground sm:text-base">
            <TeamName name={match.home_team_name} />
          </p>
        </div>

        {/* Centro: hora/resultado */}
        <div className="flex w-28 shrink-0 flex-col items-center gap-1">
          {(isLive || isFinished) && match.home_score != null ? (
            <p
              className={`flex items-center gap-2 text-4xl font-bold tabular-nums ${
                isLive ? "text-red-500" : "text-foreground"
              }`}
            >
              <span>{match.home_score}</span>
              <span className="text-2xl font-light opacity-50">–</span>
              <span>{match.away_score}</span>
            </p>
          ) : (
            <p className="text-4xl font-bold tabular-nums text-foreground">
              <KickoffTime utc={match.kickoff_utc} />
            </p>
          )}
          <span
            className={`h-1 w-10 rounded-full ${
              isLive ? "bg-red-500" : isFinished ? "bg-zinc-400" : "bg-emerald-500"
            }`}
          />
        </div>

        {/* Fora */}
        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          <TeamFlag name={awayLabel} logo={match.away_team_logo} size={48} />
          <p className="text-sm font-bold leading-tight text-foreground sm:text-base">
            <TeamName name={match.away_team_name} />
          </p>
        </div>
      </div>

      {/* Localização: cidade + bandeira */}
      {cityDisplay && (
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
          <span>📍</span>
          <span>
            {cityDisplay}
            {cityFlag && <span className="ml-1">{cityFlag}</span>}
          </span>
        </p>
      )}

      {/* Estádio */}
      {stadium && (
        <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted">
          <span>🏟</span>
          <span>{stadium}</span>
        </p>
      )}

      {/* Canais */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {match.channels && match.channels.length > 0 ? (
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-border-base/70 bg-surface-2/60 px-2 py-1">
            {match.channels.map((channel, idx) => {
              const href = getChannelHref(channel);
              const cls = channelBadgeClass(channel);

              return (
                <span key={channel} className="inline-flex items-center gap-2">
                  {idx > 0 && (
                    <span className="text-sm leading-none text-muted">•</span>
                  )}
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${cls} hover:brightness-110`}
                    >
                      {channel}
                    </a>
                  ) : (
                    <span className={cls}>{channel}</span>
                  )}
                </span>
              );
            })}
          </div>
        ) : (
          <span className="text-xs text-muted">{t("card.channelTBC")}</span>
        )}
      </div>

      {match.group_name && (
        <p className="mt-2 text-center text-[10px] uppercase tracking-wide text-muted">
          {match.group_name}
        </p>
      )}
    </article>
  );
}
