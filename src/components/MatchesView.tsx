"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { teamLabel } from "@/components/Display";
import { AccountDeletedBanner } from "@/components/AccountDeletedBanner";
import { LivePulseDot } from "@/components/LivePulseDot";
import { MatchDaySection } from "@/components/MatchDaySection";
import { TopScorers } from "@/components/TopScorers";
import { TeamSearch, useTeamSearchParam } from "@/components/TeamSearch";
import { CoffeeBanner } from "@/components/CoffeeBanner";
import { WhatsNewBanner } from "@/components/WhatsNewBanner";
import { AdSenseUnit } from "@/components/AdSenseUnit";
import { useSettings } from "@/components/SettingsProvider";
import { dayKeyWithOffset } from "@/lib/datetime";
import { HomePageSkeleton } from "@/components/skeleton/HomePageSkeleton";
import { buildMatchNumberMap } from "@/lib/match-meta";
import {
  groupMatchesByCalendarDay,
  resolveScrollTargetDay,
} from "@/lib/match-schedule";
import type { Match, TeamOption } from "@/types";

type DayMatch = Match & { isFavourite?: boolean };

const LIVE_REFRESH_MS = 30_000;
const IDLE_REFRESH_MS = 90_000;

export function MatchesView({
  matches,
  teams = [],
  loggedIn = false,
}: {
  matches: DayMatch[];
  teams?: TeamOption[];
  loggedIn?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedTeamId, setTeamId } = useTeamSearchParam();
  const { t, tz, lang, mounted } = useSettings();
  const todayKey = useMemo(() => dayKeyWithOffset(tz, 0), [tz]);
  const [showOnlyFavourites, setShowOnlyFavourites] = useState(false);
  const hasAutoScrolled = useRef(false);

  const isTeamSearch = selectedTeamId !== null;

  const teamFilteredMatches = useMemo(() => {
    if (!selectedTeamId) return matches;
    return matches.filter(
      (m) =>
        m.home_team_id === selectedTeamId ||
        m.away_team_id === selectedTeamId
    );
  }, [matches, selectedTeamId]);

  const listMatches = useMemo(() => {
    let list = isTeamSearch ? teamFilteredMatches : matches;
    if (showOnlyFavourites) {
      list = list.filter((m) => m.isFavourite);
    }
    return list;
  }, [isTeamSearch, teamFilteredMatches, matches, showOnlyFavourites]);

  const daySections = useMemo(
    () => groupMatchesByCalendarDay(listMatches, tz),
    [listMatches, tz]
  );

  const scrollTargetDay = useMemo(
    () =>
      resolveScrollTargetDay(
        daySections.map((s) => s.dayKey),
        todayKey
      ),
    [daySections, todayKey]
  );

  const matchNumberMap = useMemo(
    () => buildMatchNumberMap(matches),
    [matches]
  );

  const hasFavourites = useMemo(
    () => matches.some((m) => m.isFavourite),
    [matches]
  );

  const hasLiveNow = useMemo(
    () => listMatches.some((m) => m.status === "live"),
    [listMatches]
  );

  const needsScoreRefresh = useMemo(() => {
    const staleCutoffMs = Date.now() - 2 * 60 * 60 * 1000;
    return listMatches.some((m) => {
      if (m.status === "live") return true;
      if (m.status !== "upcoming") return false;
      return new Date(m.kickoff_utc).getTime() < staleCutoffMs;
    });
  }, [listMatches]);

  const teamHeading = useMemo(() => {
    if (!isTeamSearch) return null;
    const team = teams.find((entry) => entry.team_id === selectedTeamId);
    return team ? teamLabel(team.team_name, lang) : t("search.showingTeam");
  }, [isTeamSearch, teams, selectedTeamId, lang, t]);

  useEffect(() => {
    if (searchParams.get("favourites") === "1") {
      setShowOnlyFavourites(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!mounted || !scrollTargetDay || isTeamSearch || showOnlyFavourites) {
      return;
    }

    const fromBottomNav = searchParams.get("today") === "1";
    const shouldScroll = fromBottomNav || !hasAutoScrolled.current;
    if (!shouldScroll) return;

    requestAnimationFrame(() => {
      document
        .getElementById(`match-day-${scrollTargetDay}`)
        ?.scrollIntoView({
          behavior: fromBottomNav ? "smooth" : "instant",
          block: "start",
        });
      hasAutoScrolled.current = true;
    });

    if (fromBottomNav) {
      setShowOnlyFavourites(false);
      router.replace("/", { scroll: false });
    }
  }, [
    mounted,
    scrollTargetDay,
    isTeamSearch,
    showOnlyFavourites,
    searchParams,
    router,
  ]);

  useEffect(() => {
    if (!mounted || (!hasLiveNow && !needsScoreRefresh)) return;
    const refreshMs = hasLiveNow ? LIVE_REFRESH_MS : IDLE_REFRESH_MS;
    const id = setInterval(() => router.refresh(), refreshMs);
    return () => clearInterval(id);
  }, [mounted, hasLiveNow, needsScoreRefresh, router]);

  if (!mounted) {
    return <HomePageSkeleton />;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <AccountDeletedBanner />

      {teams.length > 0 && (
        <TeamSearch
          teams={teams}
          selectedTeamId={selectedTeamId}
          onSelectTeam={setTeamId}
        />
      )}

      {teamHeading && (
        <h2 className="text-base font-semibold text-foreground sm:text-lg">
          {teamHeading}
        </h2>
      )}

      <WhatsNewBanner />

      <div className="rounded-2xl border border-border-base bg-surface/60 px-4 py-2.5">
        <CoffeeBanner />
      </div>

      <AdSenseUnit
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME ?? ""}
        className="my-1"
      />

      {hasFavourites && (
        <button
          onClick={() => setShowOnlyFavourites((v) => !v)}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all ${
            showOnlyFavourites
              ? "border-amber-500/60 bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/30"
              : "border-border-base bg-surface text-muted hover:text-foreground"
          }`}
        >
          <span>{showOnlyFavourites ? "★" : "☆"}</span>
          {t("matches.myMatches")}
        </button>
      )}

      {hasLiveNow && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-red-500">
          <LivePulseDot size="sm" className="text-red-500" />
          {t("matches.liveRefresh")}
        </p>
      )}

      {daySections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-base bg-surface/50 px-6 py-12 text-center">
          <p className="text-lg font-medium text-foreground">
            {showOnlyFavourites
              ? t("matches.noFavMatches")
              : selectedTeamId
                ? t("matches.noTeamMatches")
                : t("matches.empty.title")}
          </p>
          <p className="mt-1 text-sm text-muted">
            {showOnlyFavourites
              ? t("matches.noFavMatchesHint")
              : selectedTeamId
                ? t("matches.noTeamMatchesHint")
                : t("matches.empty.subtitle")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {daySections.map((section) => (
            <MatchDaySection
              key={section.dayKey}
              section={section}
              matchNumberMap={matchNumberMap}
              loggedIn={loggedIn}
            />
          ))}
        </div>
      )}

      {!isTeamSearch && <TopScorers matches={matches} />}
    </div>
  );
}
