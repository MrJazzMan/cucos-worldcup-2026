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
import { LivePulseDot } from "@/components/LivePulseDot";
import { FeaturedMatch } from "@/components/FeaturedMatch";
import { MatchCard } from "@/components/MatchCard";
import { CoffeeBanner } from "@/components/CoffeeBanner";
import { AdSenseUnit } from "@/components/AdSenseUnit";
import { useSettings } from "@/components/SettingsProvider";
import { dateKeyInTz, dayKeyWithOffset } from "@/lib/datetime";
import { pickFeaturedMatch } from "@/lib/featured-match";
import type { Match } from "@/types";

type DayMatch = Match & { isFavourite?: boolean };

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

export function MatchesView({
  matches,
  loggedIn = false,
}: {
  matches: DayMatch[];
  loggedIn?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, tz, locale, mounted } = useSettings();
  const scrollRef = useRef<HTMLDivElement>(null);
  const dayButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const todayKey = useMemo(() => dayKeyWithOffset(tz, 0), [tz]);

  // All unique days that have matches, sorted
  const allDays = useMemo(() => {
    const days = new Set(matches.map((m) => dateKeyInTz(m.kickoff_utc, tz)));
    return Array.from(days).sort();
  }, [matches, tz]);

  const [selectedDay, setSelectedDay] = useState<string>(() => todayKey);
  const [showOnlyFavourites, setShowOnlyFavourites] = useState(false);

  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(
    null
  );
  const [indicatorAnimated, setIndicatorAnimated] = useState(false);

  const measureIndicator = useCallback(() => {
    const btn = dayButtonRefs.current.get(selectedDay);
    const track = scrollRef.current;
    if (!btn || !track) return;
    setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [selectedDay]);

  const hasFavourites = useMemo(
    () => matches.some((m) => m.isFavourite),
    [matches]
  );

  // If today has no matches, default to nearest future day
  useEffect(() => {
    if (!allDays.includes(todayKey) && allDays.length > 0) {
      const future = allDays.find((d) => d >= todayKey);
      setSelectedDay(future ?? allDays[allDays.length - 1]);
    } else if (allDays.includes(todayKey)) {
      setSelectedDay(todayKey);
    }
  }, [allDays, todayKey]);

  // Bottom nav: Jogos → hoje; Favoritos → filtro activo
  useEffect(() => {
    if (searchParams.get("today") === "1") {
      setSelectedDay(todayKey);
      setShowOnlyFavourites(false);
      router.replace("/", { scroll: false });
      return;
    }
    if (searchParams.get("favourites") === "1") {
      setShowOnlyFavourites(true);
    }
  }, [searchParams, todayKey, router]);

  useLayoutEffect(() => {
    if (!mounted) return;
    measureIndicator();
  }, [mounted, measureIndicator, allDays, locale]);

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
  }, [mounted, measureIndicator, allDays]);

  // Scroll active tab into view
  useEffect(() => {
    if (!mounted) return;
    const el = scrollRef.current?.querySelector("[data-active='true']");
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedDay, mounted]);

  const dayMatches = useMemo(
    () => matches.filter((m) => dateKeyInTz(m.kickoff_utc, tz) === selectedDay),
    [matches, tz, selectedDay]
  );

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

  const hasLiveToday = useMemo(
    () =>
      matches.some(
        (m) => m.status === "live" && dateKeyInTz(m.kickoff_utc, tz) === todayKey
      ),
    [matches, tz, todayKey]
  );

  // Auto-refresh when on today
  useEffect(() => {
    if (!mounted || selectedDay !== todayKey) return;
    const tick = () => router.refresh();
    const ms = hasLiveToday ? LIVE_REFRESH_MS : IDLE_REFRESH_MS;
    const id = setInterval(tick, ms);
    return () => clearInterval(id);
  }, [mounted, selectedDay, todayKey, hasLiveToday, router]);

  if (!mounted) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <div className="h-14 animate-pulse rounded-2xl bg-surface" />
        <div className="h-52 animate-pulse rounded-2xl bg-surface" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  const isToday = selectedDay === todayKey;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      {/* Seletor de dias — scroll horizontal no telemóvel; grelha igual no desktop */}
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
        {allDays.map((day) => {
          const isActive = day === selectedDay;
          const label = dayLabel(day, todayKey, tz, locale, t);
          return (
            <button
              key={day}
              ref={(el) => {
                if (el) dayButtonRefs.current.set(day, el);
                else dayButtonRefs.current.delete(day);
              }}
              data-active={isActive}
              data-day={day}
              onClick={() => setSelectedDay(day)}
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

      {/* Cabeçalho do dia */}
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground first-letter:capitalize">
            {new Intl.DateTimeFormat(locale, {
              timeZone: tz,
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date(`${selectedDay}T12:00:00Z`))}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
            {dayMatches.length}{" "}
            {dayMatches.length === 1 ? t("matches.countOne") : t("matches.count")}
          </p>
          {isToday && hasLiveToday && (
            <span className="inline-flex items-center gap-1 text-[10px] text-red-500">
              <LivePulseDot size="sm" className="text-red-500" />
              {t("matches.liveRefresh")}
            </span>
          )}
        </div>
      </div>

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
              : t("matches.empty.title")}
          </p>
          <p className="mt-1 text-sm text-muted">
            {showOnlyFavourites
              ? t("matches.noFavMatchesHint")
              : t("matches.empty.subtitle")}
          </p>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-4">
          {featuredMatch && (
            <FeaturedMatch
              match={featuredMatch}
              loggedIn={loggedIn}
            />
          )}
          {gridMatches.length > 0 && (
            <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2">
              {gridMatches.map((match) => (
                <MatchCard
                  key={match.fixture_id}
                  match={match}
                  loggedIn={loggedIn}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
