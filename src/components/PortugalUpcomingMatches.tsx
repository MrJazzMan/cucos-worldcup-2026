"use client";

import { useMemo } from "react";
import { LivePulseDot } from "@/components/LivePulseDot";
import { TeamName } from "@/components/Display";
import { MatchChannels } from "@/components/match/MatchChannels";
import { TeamFlag } from "@/components/TeamFlag";
import { useSettings } from "@/components/SettingsProvider";
import { formatShortMatchDate, timeInTz } from "@/lib/datetime";
import {
  getOpponent,
  getPortugalUpcomingMatches,
  matchPhaseLabel,
} from "@/lib/portugal-upcoming";
import { PORTUGAL_TEAM_ID } from "@/lib/world-cup";
import type { Match } from "@/types";

interface PortugalUpcomingMatchesProps {
  matches: Match[];
  excludeFixtureId?: number | null;
}

function PortugalUpcomingCard({ match }: { match: Match }) {
  const { t, tz, locale } = useSettings();
  const opponent = getOpponent(match);
  const isLive = match.status === "live";
  const phase = matchPhaseLabel(match);
  const dateLabel = formatShortMatchDate(match.kickoff_utc, tz, locale);
  const time = timeInTz(match.kickoff_utc, tz);

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border-base bg-surface px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:gap-4 sm:px-5">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium tabular-nums text-muted">
            <span>{dateLabel}</span>
            <span aria-hidden>·</span>
            <span>{time}</span>
          </span>
          {isLive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              <LivePulseDot size="sm" />
              {t("status.live")}
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 sm:justify-start">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center sm:items-end sm:text-right">
            <TeamFlag name="Portugal" teamId={PORTUGAL_TEAM_ID} size={48} />
            <p className="text-sm font-bold leading-tight text-foreground">
              <TeamName name="Portugal" />
            </p>
          </div>

          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">
            vs
          </span>

          <div className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center sm:items-start sm:text-left">
            <TeamFlag
              name={opponent.teamName}
              teamId={opponent.teamId}
              size={48}
            />
            <p className="text-sm font-bold leading-tight text-foreground">
              <TeamName name={opponent.teamName} />
            </p>
          </div>
        </div>

        {phase && (
          <p className="text-center text-[10px] uppercase tracking-wide text-muted sm:text-left">
            {phase}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-1 border-t border-border-base pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
          TV
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <MatchChannels
            channels={match.channels}
            emptyLabel={t("portugalUpcoming.channelTBC")}
          />
        </div>
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
