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

const BASE_BADGE = "inline-flex items-center rounded-lg px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide";

function channelBadgeClass(channel: string) {
  const upper = channel.toUpperCase();

  // RTP — azul oficial RTP
  if (upper.startsWith("RTP")) {
    return `${BASE_BADGE} bg-[#3565f2] text-white`;
  }

  // Sport TV — preto com amarelo dourado
  if (upper.includes("SPORT TV")) {
    return `${BASE_BADGE} bg-[#07090f] text-[#ffd230] border border-[#ffd230]/30`;
  }

  // SIC — vermelho coral característico
  if (upper === "SIC") {
    return `${BASE_BADGE} bg-[#e8000d] text-white`;
  }

  // TVI — laranja/vermelho tvi
  if (upper === "TVI") {
    return `${BASE_BADGE} bg-[#f04e23] text-white`;
  }

  // DAZN — preto com amarelo neón
  if (upper === "DAZN") {
    return `${BASE_BADGE} bg-black text-[#f5f500] border border-[#f5f500]/20`;
  }

  // LV (FIFA World Cup Live — YouTube)
  if (upper === "LV") {
    return `${BASE_BADGE} bg-[#ff0000] text-white`;
  }

  return `${BASE_BADGE} bg-surface-2 text-foreground border border-border-base`;
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
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        {match.channels && match.channels.length > 0 ? (
          match.channels.map((channel) => {
            const href = getChannelHref(channel);
            const cls = channelBadgeClass(channel);
            return href ? (
              <a
                key={channel}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${cls} transition hover:brightness-110`}
              >
                {channel}
              </a>
            ) : (
              <span key={channel} className={cls}>
                {channel}
              </span>
            );
          })
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
