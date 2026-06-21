"use client";

import { useMemo } from "react";
import { LivePulseDot } from "@/components/LivePulseDot";
import { TeamName } from "@/components/Display";
import { MatchChannels } from "@/components/match/MatchChannels";
import { TeamFlag } from "@/components/TeamFlag";
import { useSettings } from "@/components/SettingsProvider";
import { formatShortMatchDate, timeInTz } from "@/lib/datetime";
import {
  getMatchPhase,
  getOpponent,
  getPortugalUpcomingMatches,
  type MatchPhase,
} from "@/lib/portugal-upcoming";
import { PORTUGAL_TEAM_ID } from "@/lib/world-cup";
import type { Match } from "@/types";

interface PortugalUpcomingMatchesProps {
  matches: Match[];
  excludeFixtureId?: number | null;
}

function localizePhase(phase: MatchPhase, t: (k: string) => string): string {
  if (phase.kind === "group") {
    const base = t("portugalUpcoming.phase.group");
    if (phase.matchday == null) return base;
    const matchday = t("portugalUpcoming.phase.matchday").replace(
      "{n}",
      String(phase.matchday)
    );
    return `${base} · ${matchday}`;
  }
  return t(`portugalUpcoming.phase.${phase.key}`);
}

function PortugalUpcomingCard({ match }: { match: Match }) {
  const { t, tz, locale } = useSettings();
  const opponent = getOpponent(match);
  const isLive = match.status === "live";
  const phase = getMatchPhase(match);
  const phaseLabel = phase ? localizePhase(phase, t) : null;
  const dateLabel = formatShortMatchDate(match.kickoff_utc, tz, locale);
  const time = timeInTz(match.kickoff_utc, tz);

  return (
    <article className="flex flex-col gap-2.5 rounded-2xl border border-border-base bg-surface px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:items-start">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start">
          <span className="inline-flex items-center gap-1 text-xs font-medium tabular-nums text-muted">
            <span>{dateLabel}</span>
            <span aria-hidden>·</span>
            <span>{time}</span>
          </span>
          {phaseLabel && (
            <span className="text-[10px] uppercase tracking-wide text-muted">
              {phaseLabel}
            </span>
          )}
          {isLive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              <LivePulseDot size="sm" />
              {t("status.live")}
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <div className="flex w-20 flex-col items-center gap-1 text-center">
            <TeamFlag name="Portugal" teamId={PORTUGAL_TEAM_ID} size={40} />
            <p className="text-sm font-bold leading-tight text-foreground">
              <TeamName name="Portugal" />
            </p>
          </div>

          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">
            vs
          </span>

          <div className="flex w-20 flex-col items-center gap-1 text-center">
            <TeamFlag
              name={opponent.teamName}
              teamId={opponent.teamId}
              size={40}
            />
            <p className="text-sm font-bold leading-tight text-foreground">
              <TeamName name={opponent.teamName} />
            </p>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-1.5 border-t border-border-base pt-2.5 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
        <MatchChannels
          channels={match.channels}
          emptyLabel={t("portugalUpcoming.channelTBC")}
        />
      </div>
    </article>
  );
}

export function PortugalUpcomingMatches({
  matches,
  excludeFixtureId,
}: PortugalUpcomingMatchesProps) {
  const { t } = useSettings();

  const upcoming = useMemo(
    () => getPortugalUpcomingMatches(matches, { excludeFixtureId }),
    [matches, excludeFixtureId]
  );

  if (upcoming.length === 0) return null;

  return (
    <section
      aria-labelledby="portugal-upcoming-heading"
      className="flex w-full flex-col gap-3"
    >
      <h2
        id="portugal-upcoming-heading"
        className="text-base font-bold text-foreground sm:text-lg"
      >
        {t("portugalUpcoming.title")}
      </h2>
      <div className="flex flex-col gap-3">
        {upcoming.map((match) => (
          <PortugalUpcomingCard key={match.fixture_id} match={match} />
        ))}
      </div>
    </section>
  );
}
