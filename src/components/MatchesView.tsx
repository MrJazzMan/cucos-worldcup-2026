"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { teamLabel } from "@/components/Display";
import { AccountDeletedBanner } from "@/components/AccountDeletedBanner";
import { LivePulseDot } from "@/components/LivePulseDot";
import { FeaturedMatch } from "@/components/FeaturedMatch";
import { MatchCard } from "@/components/MatchCard";
import { DayStandings } from "@/components/DayStandings";
import { PortugalUpcomingMatches } from "@/components/PortugalUpcomingMatches";
import { TeamSearch, useTeamSearchParam } from "@/components/TeamSearch";
import { CoffeeBanner } from "@/components/CoffeeBanner";
import { WhatsNewBanner } from "@/components/WhatsNewBanner";
import { AdSenseUnit } from "@/components/AdSenseUnit";
import { useSettings } from "@/components/SettingsProvider";
import { dateKeyInTz, dayKeyWithOffset, displayDate, isCalendarDayKey } from "@/lib/datetime";
import {
  buildTournamentDays,
  findActiveTournamentDayId,
  formatTournamentDayRange,
  type TournamentDay,
} from "@/lib/tournament-days";
import { HomePageSkeleton } from "@/components/skeleton/HomePageSkeleton";
import { pickFeaturedMatch } from "@/lib/featured-match";
import type { GroupStanding, Match, TeamOption } from "@/types";

type DayMatch = Match & { isFavourite?: boolean };

type ScheduleView = "calendar" | "tournament";

const LIVE_REFRESH_MS = 30_000;
const IDLE_REFRESH_MS = 90_000;

function dayLabel(
  dayKey: string,
  todayKey: string,
  tz: string,
  locale: string,
  t: (k: string) => string
): string {
  const yesterdayKey = dayKeyWithOffset(tz, -1);
  const tomorrowKey = dayKeyWithOffset(tz, 1);
  if (dayKey === yesterdayKey) return t("day.yesterday");
  if (dayKey === todayKey) return t("day.today");
  if (dayKey === tomorrowKey) return t("day.tomorrow");

  // "Seg 16/6", "Dom 22/6" etc.
  const date = new Date(`${dayKey}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat(locale, {
    timeZone: tz,
    weekday: "short",
  }).format(date);
  const dayMonth = new Intl.DateTimeFormat(locale, {
    timeZone: tz,
    day: "numeric",
    month: "numeric",
  }).format(date);
  return `${weekday.replace(".", "")} ${dayMonth}`;
}

function tournamentDayTabLabel(
  day: TournamentDay,
  t: (k: string) => string
): string {
  return t("matches.tournamentDay").replace("{n}", String(day.number));
}

export function MatchesView({
  matches,
  standings = [],
  teams = [],
  loggedIn = false,
}: {
  matches: DayMatch[];
  standings?: GroupStanding[];
  teams?: TeamOption[];
  loggedIn?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedTeamId, setTeamId } = useTeamSearchParam();
  const { t, tz, locale, lang, mounted } = useSettings();
  const scrollRef = useRef<HTMLDivElement>(null);
  const dayButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const todayKey = useMemo(() => dayKeyWithOffset(tz, 0), [tz]);

  const scheduleView: ScheduleView =
    searchParams.get("view") === "calendar" ? "calendar" : "tournament";

  const setScheduleView = useCallback(
    (view: ScheduleView) => {
      const params = new URLSearchParams(searchParams.toString());
      if (view === "tournament") params.delete("view");
      else params.set("view", "calendar");
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [router, searchParams]
  );

  const teamFilteredMatches = useMemo(() => {
    if (!selectedTeamId) return matches;
    return matches.filter(
      (m) =>
        m.home_team_id === selectedTeamId ||
        m.away_team_id === selectedTeamId
    );
  }, [matches, selectedTeamId]);

  const sourceMatches = selectedTeamId ? teamFilteredMatches : matches;

  const tournamentDays = useMemo(
    () => buildTournamentDays(sourceMatches, tz),
    [sourceMatches, tz]
  );

  // All unique calendar days that have matches, sorted
  const allCalendarDays = useMemo(() => {
    const days = new Set(sourceMatches.map((m) => dateKeyInTz(m.kickoff_utc, tz)));
    return Array.from(days).sort();
  }, [sourceMatches, tz]);

  const allTabs = useMemo(
    () =>
      scheduleView === "tournament"
        ? tournamentDays.map((d) => d.id)
        : allCalendarDays,
    [scheduleView, tournamentDays, allCalendarDays]
  );

  const [selectedTab, setSelectedTab] = useState<string>(() => todayKey);
  const [showOnlyFavourites, setShowOnlyFavourites] = useState(false);

  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(
    null
  );
  const [indicatorAnimated, setIndicatorAnimated] = useState(false);

  const isTeamSearch = selectedTeamId !== null;

  const activeTab = useMemo(() => {
    if (allTabs.includes(selectedTab)) return selectedTab;
    if (scheduleView === "tournament") {
      return (
        findActiveTournamentDayId(tournamentDays, todayKey) ??
        allTabs[0] ??
        todayKey
      );
    }
    if (allCalendarDays.includes(todayKey)) return todayKey;
    return allCalendarDays[allCalendarDays.length - 1] ?? todayKey;
  }, [
    allTabs,
    selectedTab,
    scheduleView,
    tournamentDays,
    todayKey,
    allCalendarDays,
  ]);

  const measureIndicator = useCallback(() => {
    const btn = dayButtonRefs.current.get(activeTab);
    const track = scrollRef.current;
    if (!btn || !track) return;
    setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [activeTab]);

  const hasFavourites = useMemo(
    () => matches.some((m) => m.isFavourite),
    [matches]
  );

  // Ao mudar de vista, saltar para o período actual
  useEffect(() => {
    if (allTabs.length === 0) return;

    if (scheduleView === "tournament") {
      const activeId = findActiveTournamentDayId(tournamentDays, todayKey);
      if (activeId) setSelectedTab(activeId);
      return;
    }

    if (allCalendarDays.includes(todayKey)) {
      setSelectedTab(todayKey);
      return;
    }
    const future = allCalendarDays.find((d) => d >= todayKey);
    setSelectedTab(future ?? allCalendarDays[allCalendarDays.length - 1]!);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao mudar de vista
  }, [scheduleView]);

  // Se a tab seleccionada deixar de existir (ex. filtro de equipa), reajustar
  useEffect(() => {
    if (allTabs.length === 0) return;
    if (allTabs.includes(selectedTab)) return;

    if (scheduleView === "tournament") {
      const activeId = findActiveTournamentDayId(tournamentDays, todayKey);
      setSelectedTab(activeId ?? allTabs[0]!);
      return;
    }

    const future = allCalendarDays.find((d) => d >= todayKey);
    setSelectedTab(future ?? allCalendarDays[allCalendarDays.length - 1]!);
  }, [allTabs, selectedTab, scheduleView, tournamentDays, allCalendarDays, todayKey]);

  // Bottom nav: Jogos → hoje; Favoritos → filtro activo
  useEffect(() => {
    if (searchParams.get("today") === "1") {
      if (scheduleView === "tournament") {
        const activeId = findActiveTournamentDayId(tournamentDays, todayKey);
        if (activeId) setSelectedTab(activeId);
      } else {
        setSelectedTab(todayKey);
      }
      setShowOnlyFavourites(false);
      router.replace("/", { scroll: false });
      return;
    }
    if (searchParams.get("favourites") === "1") {
      setShowOnlyFavourites(true);
    }
  }, [searchParams, todayKey, router, scheduleView, tournamentDays, tz]);

  useLayoutEffect(() => {
    if (!mounted) return;
    measureIndicator();
  }, [mounted, measureIndicator, allTabs, locale]);

  useLayoutEffect(() => {
    if (!mounted || indicator === null) return;
    const id = requestAnimationFrame(() => setIndicatorAnimated(true));
    return () => cancelAnimationFrame(id);
  }, [mounted, indicator]);

  useEffect(() => {
    if (!mounted) return;
    const track = scrollRef.current;
    if (!track) return;
    const ro = new ResizeObserver(measureIndicator);
    ro.observe(track);
    for (const btn of dayButtonRefs.current.values()) ro.observe(btn);
    return () => ro.disconnect();
  }, [mounted, measureIndicator, allTabs]);

  // Scroll active tab into view
  useEffect(() => {
    if (!mounted) return;
    const el = scrollRef.current?.querySelector("[data-active='true']");
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeTab, mounted]);

  const selectedTournamentDay = useMemo(
    () => tournamentDays.find((d) => d.id === activeTab) ?? null,
    [tournamentDays, activeTab]
  );

  const dayMatches = useMemo(() => {
    if (isTeamSearch) {
      return [...teamFilteredMatches].sort(
        (a, b) =>
          new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
      );
    }
    if (scheduleView === "tournament") {
      return selectedTournamentDay?.matches ?? [];
    }
    return sourceMatches.filter(
      (m) => dateKeyInTz(m.kickoff_utc, tz) === activeTab
    );
  }, [
    isTeamSearch,
    teamFilteredMatches,
    scheduleView,
    selectedTournamentDay,
    sourceMatches,
    activeTab,
    tz,
  ]);

  const kickoffAnchorDay = useMemo(() => {
    if (isTeamSearch) return undefined;
    if (scheduleView === "tournament" && selectedTournamentDay) {
      return selectedTournamentDay.sessionStartKey;
    }
    return isCalendarDayKey(activeTab) ? activeTab : undefined;
  }, [isTeamSearch, scheduleView, selectedTournamentDay, activeTab]);

  const visibleMatches = useMemo(
    () =>
      showOnlyFavourites ? dayMatches.filter((m) => m.isFavourite) : dayMatches,
    [dayMatches, showOnlyFavourites]
  );

  const featuredMatch = useMemo(
    () => pickFeaturedMatch(visibleMatches),
    [visibleMatches]
  );

  const gridMatches = useMemo(
    () =>
      featuredMatch
        ? visibleMatches.filter((m) => m.fixture_id !== featuredMatch.fixture_id)
        : visibleMatches,
    [visibleMatches, featuredMatch]
  );

  const isCurrentPeriod = useMemo(() => {
    if (isTeamSearch) {
      return dayMatches.some(
        (m) =>
          m.status === "live" ||
          dateKeyInTz(m.kickoff_utc, tz) === todayKey
      );
    }
    if (scheduleView === "tournament" && selectedTournamentDay) {
      return (
        selectedTournamentDay.sessionStartKey <= todayKey &&
        todayKey <= selectedTournamentDay.sessionEndKey
      );
    }
    return activeTab === todayKey;
  }, [
    isTeamSearch,
    dayMatches,
    tz,
    todayKey,
    scheduleView,
    selectedTournamentDay,
    activeTab,
  ]);

  const hasLiveNow = useMemo(
    () => dayMatches.some((m) => m.status === "live"),
    [dayMatches]
  );

  // Auto-refresh no período actual
  useEffect(() => {
    if (!mounted || !isCurrentPeriod) return;
    const tick = () => router.refresh();
    const ms = hasLiveNow ? LIVE_REFRESH_MS : IDLE_REFRESH_MS;
    const id = setInterval(tick, ms);
    return () => clearInterval(id);
  }, [mounted, isCurrentPeriod, hasLiveNow, router]);

  const periodHeading = useMemo(() => {
    if (isTeamSearch) {
      const team = teams.find((entry) => entry.team_id === selectedTeamId);
      return team ? teamLabel(team.team_name, lang) : t("search.showingTeam");
    }
    if (scheduleView === "tournament") {
      const day = tournamentDays.find((d) => d.id === activeTab);
      if (!day) return "";
      const range = formatTournamentDayRange(day, tz, locale);
      const heading = t("matches.tournamentDayHeading").replace(
        "{n}",
        String(day.number)
      );
      return `${heading} · ${range}`;
    }
    if (!isCalendarDayKey(activeTab)) return "";
    return displayDate(activeTab, tz, locale);
  }, [
    isTeamSearch,
    teams,
    selectedTeamId,
    lang,
    scheduleView,
    tournamentDays,
    activeTab,
    tz,
    locale,
    t,
  ]);

  if (!mounted) {
    return <HomePageSkeleton />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <AccountDeletedBanner />

      {teams.length > 0 && (
        <TeamSearch
          teams={teams}
          selectedTeamId={selectedTeamId}
          onSelectTeam={setTeamId}
        />
      )}

      {/* Vista: por data civil vs dia de jogos do torneio */}
      {!isTeamSearch && (
        <div
          role="tablist"
          aria-label={t("matches.viewModeLabel")}
          className="flex w-full rounded-2xl border border-border-base bg-surface p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={scheduleView === "tournament"}
            onClick={() => setScheduleView("tournament")}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              scheduleView === "tournament"
                ? "bg-accent/15 text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t("matches.view.tournament")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scheduleView === "calendar"}
            onClick={() => setScheduleView("calendar")}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              scheduleView === "calendar"
                ? "bg-accent/15 text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t("matches.view.calendar")}
          </button>
        </div>
      )}

      {/* Seletor de dias — scroll horizontal no telemóvel; grelha igual no desktop */}
      {!isTeamSearch && (
      <div
        ref={scrollRef}
        className="day-tabs__track flex w-full gap-1.5 overflow-x-auto rounded-2xl border border-border-base bg-surface p-1.5 scrollbar-none md:overflow-visible"
        style={{ scrollbarWidth: "none" }}
      >
        {indicator && (
          <span
            aria-hidden
            className={`day-tabs__indicator${indicatorAnimated ? "" : " day-tabs__indicator--instant"}`}
            style={{ left: indicator.left, width: indicator.width }}
          />
        )}
        {allTabs.map((tabKey) => {
          const isActive = tabKey === activeTab;
          const tDay = tournamentDays.find((d) => d.id === tabKey);
          const label =
            scheduleView === "tournament" && tDay
              ? tournamentDayTabLabel(tDay, t)
              : dayLabel(tabKey, todayKey, tz, locale, t);
          return (
            <button
              key={tabKey}
              ref={(el) => {
                if (el) dayButtonRefs.current.set(tabKey, el);
                else dayButtonRefs.current.delete(tabKey);
              }}
              data-active={isActive}
              data-day={tabKey}
              onClick={() => setSelectedTab(tabKey)}
              title={
                scheduleView === "tournament" && tDay
                  ? formatTournamentDayRange(tDay, tz, locale)
                  : undefined
              }
              className={`relative z-[1] shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors md:min-w-0 md:flex-1 md:shrink md:px-2 md:text-center ${
                isActive
                  ? "text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      )}

      {/* Cabeçalho do dia */}
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground first-letter:capitalize">
            {periodHeading}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
            {dayMatches.length}{" "}
            {dayMatches.length === 1 ? t("matches.countOne") : t("matches.count")}
          </p>
          {isCurrentPeriod && hasLiveNow && (
            <span className="inline-flex items-center gap-1 text-[10px] text-red-500">
              <LivePulseDot size="sm" className="text-red-500" />
              {t("matches.liveRefresh")}
            </span>
          )}
        </div>
      </div>

      {/* Novidades — mostra até fechar; depois não volta (ver WHATS_NEW_VERSION) */}
      <WhatsNewBanner />

      {/* Banner café */}
      <div className="w-full rounded-2xl border border-border-base bg-surface/60 px-4 py-2.5">
        <CoffeeBanner />
      </div>

      <AdSenseUnit
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME ?? ""}
        className="my-1"
      />

      {/* Filtro de favoritos */}
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

      {/* Lista de jogos */}
      {visibleMatches.length === 0 ? (
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
        <div key={isTeamSearch ? `team-${selectedTeamId}` : activeTab} className="flex w-full flex-col gap-4">
          {featuredMatch && (
            <FeaturedMatch
              match={featuredMatch}
              loggedIn={loggedIn}
              staggerIndex={0}
              selectedDay={kickoffAnchorDay}
            />
          )}
          {gridMatches.length > 0 && (
            <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2">
              {gridMatches.map((match, i) => (
                <MatchCard
                  key={match.fixture_id}
                  match={match}
                  loggedIn={loggedIn}
                  staggerIndex={featuredMatch ? i + 1 : i}
                  selectedDay={kickoffAnchorDay}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {!isTeamSearch && (
      <PortugalUpcomingMatches
        matches={matches}
        excludeFixtureId={featuredMatch?.fixture_id}
        loggedIn={loggedIn}
      />
      )}

      {!isTeamSearch && (
      <DayStandings
        matches={matches}
        standings={standings}
        dayMatches={dayMatches}
      />
      )}
    </div>
  );
}
