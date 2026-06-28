"use client";

import { useMemo } from "react";
import { MatchDaySection } from "@/components/MatchDaySection";
import { useSettings } from "@/components/SettingsProvider";
import { buildMatchNumberMap } from "@/lib/match-meta";
import { groupMatchesByCalendarDay } from "@/lib/match-schedule";
import type { Match } from "@/types";

interface KnockoutScheduleProps {
  matches: (Match & { isFavourite?: boolean })[];
  allMatches: Match[];
  loggedIn?: boolean;
}

export function KnockoutSchedule({
  matches,
  allMatches,
  loggedIn = false,
}: KnockoutScheduleProps) {
  const { t, tz } = useSettings();

  const daySections = useMemo(
    () => groupMatchesByCalendarDay(matches, tz),
    [matches, tz]
  );

  const matchNumberMap = useMemo(
    () => buildMatchNumberMap(allMatches.length > 0 ? allMatches : matches),
    [allMatches, matches]
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 pt-2">
      <h2 className="text-lg font-semibold text-foreground">
        {t("knockouts.schedule")}
      </h2>
      <div className="flex flex-col gap-8">
        {daySections.map((section) => (
          <MatchDaySection
            key={section.dayKey}
            section={section}
            matchNumberMap={matchNumberMap}
            loggedIn={loggedIn}
            linkHref="/fasefinal"
            linkLabel={t("matches.viewBrackets")}
          />
        ))}
      </div>
    </div>
  );
}
