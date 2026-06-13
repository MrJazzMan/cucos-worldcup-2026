"use client";

import { TeamFlag } from "@/components/TeamFlag";
import { KickoffTime, TeamName, teamLabel } from "@/components/Display";
import { useSettings } from "@/components/SettingsProvider";
import { getChannelHref } from "@/lib/channels";
import { getStatusColor } from "@/lib/match-utils";
import type { Match } from "@/types";

interface MatchCardProps {
  match: Match & { isFavourite?: boolean };
}

export function MatchCard({ match }: MatchCardProps) {
  const { t, lang } = useSettings();
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const homeLabel = teamLabel(match.home_team_name, lang);
  const awayLabel = teamLabel(match.away_team_name, lang);

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

      <div className="mb-3 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusColor(match.status)}`}
        >
          {isLive && (
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-current" />
          )}
          {t(`status.${match.status}`)}
          {isLive && match.minute != null && (
            <span className="ml-0.5">{match.minute}&apos;</span>
          )}
        </span>
        {match.isFavourite && (
          <span className="text-amber-400" aria-label="★">
            ★
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          <TeamFlag name={homeLabel} logo={match.home_team_logo} size={44} />
          <p className="text-base font-semibold leading-tight text-foreground sm:text-lg">
            <TeamName name={match.home_team_name} />
          </p>
        </div>

        <div className="flex min-w-[5rem] flex-col items-center gap-1">
          {(isLive || isFinished) && match.home_score != null ? (
            <p className="rounded-xl bg-surface-2 px-3 py-1 text-2xl font-bold tabular-nums text-foreground">
              {match.home_score} <span className="text-muted">–</span>{" "}
              {match.away_score}
            </p>
          ) : (
            <p className="text-2xl font-bold tabular-nums text-foreground">
              <KickoffTime utc={match.kickoff_utc} />
            </p>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          <TeamFlag name={awayLabel} logo={match.away_team_logo} size={44} />
          <p className="text-base font-semibold leading-tight text-foreground sm:text-lg">
            <TeamName name={match.away_team_name} />
          </p>
        </div>
      </div>

      {match.group_name && (
        <p className="mt-3 text-center text-xs text-muted">{match.group_name}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {match.channels && match.channels.length > 0 ? (
          match.channels.map((channel) => {
            const href = getChannelHref(channel);
            const className =
              "rounded-lg bg-accent-soft px-3 py-1 text-sm font-medium text-accent";
            const label = `📺 ${channel}`;

            if (href) {
              return (
                <a
                  key={channel}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${className} hover:brightness-110`}
                >
                  {label}
                </a>
              );
            }

            return (
              <span key={channel} className={className}>
                {label}
              </span>
            );
          })
        ) : (
          <span className="text-sm text-muted">{t("card.channelTBC")}</span>
        )}
      </div>
    </article>
  );
}
