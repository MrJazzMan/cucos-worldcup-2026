"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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

const LIVE_REFRESH_MS = 30_000;
const IDLE_REFRESH_MS = 90_000;

export function KnockoutSchedule({
  matches,
  allMatches,
  loggedIn = false,
}: KnockoutScheduleProps) {
  const router = useRouter();
  const { t, tz, mounted } = useSettings();

  const daySections = useMemo(
    () => groupMatchesByCalendarDay(matches, tz),
    [matches, tz]
  );

  const matchNumberMap = useMemo(
    () => buildMatchNumberMap(allMatches.length > 0 ? allMatches : matches),
    [allMatches, matches]
  );

  const hasLiveNow = useMemo(
    () => matches.some((m) => m.status === "live"),
    [matches]
  );

  const needsScoreRefresh = useMemo(() => {
    const staleCutoffMs = Date.now() - 2 * 60 * 60 * 1000;
    return matches.some((m) => {
      if (m.status === "live") return true;
      if (m.status !== "upcoming") return false;
      return new Date(m.kickoff_utc).getTime() < staleCutoffMs;
    });
  }, [matches]);

  useEffect(() => {
    if (!mounted || (!hasLiveNow && !needsScoreRefresh)) return;
    const refreshMs = hasLiveNow ? LIVE_REFRESH_MS : IDLE_REFRESH_MS;
    const id = setInterval(() => router.refresh(), refreshMs);
    return () => clearInterval(id);
  }, [mounted, hasLiveNow, needsScoreRefresh, router]);

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
