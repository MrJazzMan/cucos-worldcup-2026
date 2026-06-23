"use client";

import Link from "next/link";
import { useMemo } from "react";
import { GroupStandingsTable } from "@/components/GroupStandingsTable";
import { useSettings } from "@/components/SettingsProvider";
import { getDayStandingsGroups } from "@/lib/day-standings";
import type { GroupStanding, Match } from "@/types";

interface DayStandingsProps {
  matches: Match[];
  standings: GroupStanding[];
  dayMatches: Match[];
}

export function DayStandings({
  matches,
  standings,
  dayMatches,
}: DayStandingsProps) {
  const { t } = useSettings();

  const groups = useMemo(
    () => getDayStandingsGroups(dayMatches, matches, standings),
    [dayMatches, matches, standings]
  );

  if (groups.length === 0) return null;

  return (
    <section
      aria-labelledby="day-standings-heading"
      className="flex w-full flex-col gap-3"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="day-standings-heading"
          className="text-base font-bold text-foreground sm:text-lg"
        >
          {t("dayStandings.title")}
        </h2>
        <Link
          href="/grupos"
          className="text-sm font-medium text-primary hover:underline"
        >
          {t("dayStandings.viewAll")}
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {groups.map((group) => (
          <div
            key={group.group_name}
            className="overflow-hidden rounded-2xl border border-border-base bg-surface shadow-sm"
          >
            <h3 className="border-b border-border-base px-4 py-2.5 text-sm font-semibold text-foreground sm:text-base">
              {group.group_name}
            </h3>
            <GroupStandingsTable group={group} variant="compact" />
          </div>
        ))}
      </div>
    </section>
  );
}
