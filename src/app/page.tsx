import { MatchesView } from "@/components/MatchesView";
import {
  getAllMatches,
  getUserFavouriteTeamIds,
} from "@/lib/matches";
import { getMockMatchesForDate } from "@/lib/mock-data";
import { getDateForOffset } from "@/lib/timezone";
import type { Match } from "@/types";

async function loadAllMatches(favouriteIds: number[]) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return mockWindow(favouriteIds);
  }

  try {
    const matches = await getAllMatches(favouriteIds);
    if (matches.length > 0) return matches;
    return mockWindow(favouriteIds);
  } catch {
    return mockWindow(favouriteIds);
  }
}

function mockWindow(favouriteIds: number[]): (Match & { isFavourite?: boolean })[] {
  const days = [-1, 0, 1] as const;
  const all = days.flatMap((d) => getMockMatchesForDate(getDateForOffset(d)));
  return all.map((m) => ({
    ...m,
    isFavourite:
      favouriteIds.includes(m.home_team_id) ||
      favouriteIds.includes(m.away_team_id),
  }));
}

export default async function HomePage() {
  const favouriteIds = await getUserFavouriteTeamIds().catch(() => [] as number[]);
  const matches = await loadAllMatches(favouriteIds);

  return <MatchesView matches={matches} />;
}

export const revalidate = 60;
