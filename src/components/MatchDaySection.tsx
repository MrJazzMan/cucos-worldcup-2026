"use client";

import Link from "next/link";
import { ScheduleMatchCard } from "@/components/ScheduleMatchCard";
import { useSettings } from "@/components/SettingsProvider";
import { isKnockoutRound } from "@/lib/knockout-bracket";
import {
  formatScheduleDayHeading,
  type MatchDaySection as MatchDaySectionData,
} from "@/lib/match-schedule";
import type { Match } from "@/types";

interface MatchDaySectionProps {
  section: MatchDaySectionData;
  matchNumberMap: Map<number, number>;
  loggedIn?: boolean;
  linkHref?: string;
  linkLabel?: string;
}

export function MatchDaySection({
  section,
  matchNumberMap,
  loggedIn = false,
  linkHref: linkHrefOverride,
  linkLabel: linkLabelOverride,
}: MatchDaySectionProps) {
  const { t, tz, locale } = useSettings();
  const heading = formatScheduleDayHeading(section.dayKey, tz, locale);
  const hasKnockout = section.matches.some((m) => isKnockoutRound(m.round));
  const linkHref =
    linkHrefOverride ?? (hasKnockout ? "/fasefinal" : "/grupos");
  const linkLabel =
    linkLabelOverride ??
    (hasKnockout ? t("matches.viewBrackets") : t("matches.viewGroups"));

  return (
    <section
      id={`match-day-${section.dayKey}`}
      aria-labelledby={`match-day-heading-${section.dayKey}`}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id={`match-day-heading-${section.dayKey}`}
          className="text-sm font-medium text-foreground sm:text-base"
        >
          {heading}
        </h2>
        <Link
          href={linkHref}
          className="text-xs font-medium text-primary hover:underline sm:text-sm"
        >
          {linkLabel}
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {section.matches.map((match: Match & { isFavourite?: boolean }) => (
          <ScheduleMatchCard
            key={match.fixture_id}
            match={match}
            loggedIn={loggedIn}
            matchNumber={matchNumberMap.get(match.fixture_id)}
          />
        ))}
      </div>
    </section>
  );
}
