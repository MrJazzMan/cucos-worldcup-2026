import { Suspense } from "react";
import { MatchList } from "@/components/MatchList";
import {
  getMatchesForDay,
  getUserFavouriteTeamIds,
} from "@/lib/matches";
import { getMockMatchesForDate } from "@/lib/mock-data";
import { getDateForOffset } from "@/lib/timezone";
import type { DayOffset, Match } from "@/types";

interface PageProps {
  searchParams: Promise<{ dia?: string }>;
}

async function loadMatches(offset: DayOffset, favouriteIds: number[]) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const date = getDateForOffset(offset);
    return getMockMatchesForDate(date).map((m) => ({
      ...m,
      isFavourite:
        favouriteIds.includes(m.home_team_id) ||
        favouriteIds.includes(m.away_team_id),
    }));
  }

  try {
    const matches = await getMatchesForDay(offset, favouriteIds);
    if (matches.length > 0) return matches;

    const date = getDateForOffset(offset);
    return getMockMatchesForDate(date).map((m) => ({
      ...m,
      isFavourite:
        favouriteIds.includes(m.home_team_id) ||
        favouriteIds.includes(m.away_team_id),
    }));
  } catch {
    const date = getDateForOffset(offset);
    return getMockMatchesForDate(date);
  }
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const raw = Number(params.dia ?? "0");
  const offset = ([-1, 0, 1] as DayOffset[]).includes(raw as DayOffset)
    ? (raw as DayOffset)
    : 0;

  const favouriteIds = await getUserFavouriteTeamIds().catch(() => [] as number[]);
  const matches = await loadMatches(offset, favouriteIds);

  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      }
    >
      <MatchList matches={matches as (Match & { isFavourite?: boolean })[]} offset={offset} />
    </Suspense>
  );
}

export const revalidate = 60;
