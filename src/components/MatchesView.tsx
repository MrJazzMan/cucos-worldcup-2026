"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MatchCard } from "@/components/MatchCard";
import { useSettings } from "@/components/SettingsProvider";
import {
  dateKeyInTz,
  dayKeyWithOffset,
  displayDate,
} from "@/lib/datetime";
import type { Match } from "@/types";

type DayMatch = Match & { isFavourite?: boolean };

const OFFSETS = [
  { offset: -1, key: "day.yesterday" },
  { offset: 0, key: "day.today" },
  { offset: 1, key: "day.tomorrow" },
] as const;

/** Intervalo de auto-refresh no separador "Hoje" (ms). */
const LIVE_REFRESH_MS = 45_000;

export function MatchesView({ matches }: { matches: DayMatch[] }) {
  const router = useRouter();
  const { t, tz, locale, mounted } = useSettings();
  const [offset, setOffset] = useState<number>(0);

  const selectedKey = useMemo(
    () => dayKeyWithOffset(tz, offset),
    [tz, offset]
  );

  const dayMatches = useMemo(
    () =>
      matches.filter((m) => dateKeyInTz(m.kickoff_utc, tz) === selectedKey),
    [matches, tz, selectedKey]
  );

  const hasLiveToday = useMemo(
    () =>
      matches.some(
        (m) =>
          m.status === "live" &&
          dateKeyInTz(m.kickoff_utc, tz) === dayKeyWithOffset(tz, 0)
      ),
    [matches, tz]
  );

  // Auto-refresh: em "Hoje" a cada 45s; com jogos ao vivo refresca sempre.
  useEffect(() => {
    if (!mounted || offset !== 0) return;

    const tick = () => router.refresh();
    const ms = hasLiveToday ? LIVE_REFRESH_MS : LIVE_REFRESH_MS * 2;
    const id = setInterval(tick, ms);
    return () => clearInterval(id);
  }, [mounted, offset, hasLiveToday, router]);

  if (!mounted) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-2xl border border-border-base bg-surface p-1.5">
        {OFFSETS.map((tab) => {
          const active = tab.offset === offset;
          return (
            <button
              key={tab.offset}
              onClick={() => setOffset(tab.offset)}
              className={`flex-1 rounded-xl py-3 text-center text-base font-semibold transition-all ${
                active
                  ? "bg-gradient-to-br from-accent to-blue-400 text-white shadow-md shadow-accent/30"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t(tab.key)}
            </button>
          );
        })}
      </div>

      <div className="px-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium capitalize text-muted">
            {displayDate(selectedKey, tz, locale)}
          </h2>
          {offset === 0 && hasLiveToday && (
            <span className="inline-flex items-center gap-1.5 text-xs text-red-500">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-current" />
              {t("matches.liveRefresh")}
            </span>
          )}
        </div>
      </div>

      {dayMatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-base bg-surface/50 px-6 py-12 text-center">
          <p className="text-lg font-medium text-foreground">
            {t("matches.empty.title")}
          </p>
          <p className="mt-1 text-sm text-muted">{t("matches.empty.subtitle")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayMatches.map((match) => (
            <MatchCard key={match.fixture_id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
