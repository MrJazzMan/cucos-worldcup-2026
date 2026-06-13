"use client";

import { useEffect, useMemo, useState } from "react";
import { TeamFlag } from "@/components/TeamFlag";
import { KickoffTime, TeamName, teamLabel } from "@/components/Display";
import { useSettings } from "@/components/SettingsProvider";
import { getChannelHref } from "@/lib/channels";
import { parseVenue, venueCountryLabel } from "@/lib/venues";
import type { Match } from "@/types";

interface MatchCardProps {
  match: Match & { isFavourite?: boolean };
}

function countdownLabel(
  kickoffUtc: string,
  t: (key: string) => string
): string | null {
  const diff = new Date(kickoffUtc).getTime() - Date.now();
  if (diff <= 0 || diff > 6 * 60 * 60 * 1000) return null;
  const minutes = Math.ceil(diff / 60_000);
  if (minutes < 60) {
    return t("status.inMinutes").replace("{n}", String(minutes));
  }
  const hours = Math.ceil(diff / 3_600_000);
  return t("status.inHours").replace("{n}", String(hours));
}

function statusStyles(status: Match["status"], soon: boolean) {
  if (status === "live") return "bg-red-500 text-white";
  if (status === "finished") return "bg-zinc-400 text-white";
  if (soon) return "bg-emerald-500 text-white";
  return "bg-emerald-600/80 text-white";
}

export function MatchCard({ match }: MatchCardProps) {
  const { t, lang } = useSettings();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (match.status !== "upcoming") return;
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [match.status]);

  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const homeLabel = teamLabel(match.home_team_name, lang);
  const awayLabel = teamLabel(match.away_team_name, lang);
  const venue = parseVenue(match.venue);
  const country =
    venue.city && venueCountryLabel(venue.city, lang)
      ? `${venue.city}, ${venueCountryLabel(venue.city, lang)}`
      : venue.city;

  const countdown = useMemo(
    () => (match.status === "upcoming" ? countdownLabel(match.kickoff_utc, t) : null),
    [match.status, match.kickoff_utc, t, now]
  );

  return (
    <article
      className={`animate-rise relative overflow-hidden rounded-2xl border bg-surface p-4 shadow-sm transition-all hover:shadow-md ${
        match.isFavourite
          ? "border-amber-500/60 ring-1 ring-amber-500/30"
          : "border-border-base"
      }`}
    >
      {isLive && (
        <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
      )}

      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        {/* Esquerda: estado + equipas */}
        <div className="min-w-0 space-y-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${statusStyles(match.status, !!countdown)}`}
          >
            {isLive && (
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-current" />
            )}
            {countdown ??
              (isLive && match.minute != null
                ? `${t("status.live")} ${match.minute}'`
                : t(`status.${match.status}`))}
          </span>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TeamFlag name={homeLabel} logo={match.home_team_logo} size={28} />
              <p className="truncate text-sm font-semibold text-foreground">
                <TeamName name={match.home_team_name} />
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TeamFlag name={awayLabel} logo={match.away_team_logo} size={28} />
              <p className="truncate text-sm font-semibold text-foreground">
                <TeamName name={match.away_team_name} />
              </p>
            </div>
          </div>
        </div>

        {/* Centro: resultado ou hora */}
        <div className="flex min-w-[4.5rem] flex-col items-center justify-center self-center px-1">
          {(isLive || isFinished) && match.home_score != null ? (
            <p
              className={`text-2xl font-bold tabular-nums ${
                isLive ? "text-red-500" : "text-foreground"
              }`}
            >
              {match.home_score}
              <span className="mx-1 text-muted">-</span>
              {match.away_score}
            </p>
          ) : (
            <p className="text-2xl font-bold tabular-nums text-foreground">
              <KickoffTime utc={match.kickoff_utc} />
            </p>
          )}
        </div>

        {/* Direita: local + canais + favorito */}
        <div className="min-w-0 space-y-2 text-right">
          {match.isFavourite && (
            <span className="text-amber-400" aria-label="★">
              ★
            </span>
          )}

          {(country || venue.stadium) && (
            <div className="space-y-0.5 text-[11px] text-muted">
              {country && (
                <p className="flex items-center justify-end gap-1">
                  <span>📍</span>
                  <span className="truncate">
                    {country}
                    {venue.countryFlag && (
                      <span className="ml-1">{venue.countryFlag}</span>
                    )}
                  </span>
                </p>
              )}
              {venue.stadium && (
                <p className="flex items-center justify-end gap-1 truncate">
                  <span>🏟️</span>
                  <span className="truncate">{venue.stadium}</span>
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-1">
            {match.channels && match.channels.length > 0 ? (
              match.channels.map((channel) => {
                const href = getChannelHref(channel);
                const cls =
                  "rounded border border-border-base bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-foreground";
                if (href) {
                  return (
                    <a
                      key={channel}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${cls} hover:bg-accent-soft`}
                    >
                      {channel}
                    </a>
                  );
                }
                return (
                  <span key={channel} className={cls}>
                    {channel}
                  </span>
                );
              })
            ) : (
              <span className="text-[10px] text-muted">{t("card.channelTBC")}</span>
            )}
          </div>
        </div>
      </div>

      {match.group_name && (
        <p className="mt-2 text-center text-[10px] uppercase tracking-wide text-muted">
          {match.group_name}
        </p>
      )}
    </article>
  );
}
