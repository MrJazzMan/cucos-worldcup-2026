"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MatchCard } from "@/components/MatchCard";
import { useSettings } from "@/components/SettingsProvider";
import { dateKeyInTz, dayKeyWithOffset } from "@/lib/datetime";
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

export function MatchesView({ matches }: { matches: DayMatch[] }) {
  const router = useRouter();
  const { t, tz, locale, mounted } = useSettings();
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayKey = useMemo(() => dayKeyWithOffset(tz, 0), [tz]);

  // All unique days that have matches, sorted
  const allDays = useMemo(() => {
    const days = new Set(matches.map((m) => dateKeyInTz(m.kickoff_utc, tz)));
    return Array.from(days).sort();
  }, [matches, tz]);

  const [selectedDay, setSelectedDay] = useState<string>(() => todayKey);
  const [showOnlyFavourites, setShowOnlyFavourites] = useState(false);

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
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface" />
        ))}
      </div>
    );
  }

  const selectedLabel = dayLabel(selectedDay, todayKey, tz, locale, t);
  const isToday = selectedDay === todayKey;

  return (
    <div className="space-y-4">
      {/* Seletor de dias — scroll horizontal */}
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto rounded-2xl border border-border-base bg-surface p-1.5 scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        {allDays.map((day) => {
          const isActive = day === selectedDay;
          const label = dayLabel(day, todayKey, tz, locale, t);
          return (
            <button
              key={day}
              data-active={isActive}
              onClick={() => setSelectedDay(day)}
              className={`shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-gradient-to-br from-accent to-amber-400 text-white shadow-md shadow-accent/30"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Cabeçalho do dia */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-muted">📅</span>
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
              <span className="live-dot inline-block h-1 w-1 rounded-full bg-current" />
              {t("matches.liveRefresh")}
            </span>
          )}
        </div>
      </div>

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
        <div className="space-y-3">
          {visibleMatches.map((match) => (
            <MatchCard key={match.fixture_id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
