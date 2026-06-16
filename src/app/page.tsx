import { MatchesView } from "@/components/MatchesView";
import {
  getAllMatches,
  getUserFavouriteTeamIds,
} from "@/lib/matches";
import { getMockMatchesForDate } from "@/lib/mock-data";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getDateForOffset } from "@/lib/timezone";
import type { Match } from "@/types";

async function loadAllMatches(
  favouriteIds: number[],
  includeChannels: boolean
) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return mockWindow(favouriteIds, includeChannels);
  }

  try {
    const matches = await getAllMatches(favouriteIds, includeChannels);
    if (matches.length > 0) return matches;
    return mockWindow(favouriteIds, includeChannels);
  } catch {
    return mockWindow(favouriteIds, includeChannels);
  }
}

function mockWindow(
  favouriteIds: number[],
  includeChannels: boolean
): (Match & { isFavourite?: boolean })[] {
  const days = [-1, 0, 1] as const;
  const all = days.flatMap((d) => getMockMatchesForDate(getDateForOffset(d)));
  return all.map((m) => ({
    ...m,
    channels: includeChannels ? m.channels : [],
    isFavourite:
      favouriteIds.includes(m.home_team_id) ||
      favouriteIds.includes(m.away_team_id),
  }));
}

export default async function HomePage() {
  const supabase = await createSupabaseServer();
  let loggedIn = false;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    loggedIn = !!user;

    if (user) {
      // Regista a última visita. Usa service-role para não depender da RLS de UPDATE.
      try {
        const admin = createSupabaseAdmin();
        await admin
          .from("profiles")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("user_id", user.id);
      } catch {
        // Não bloquear a página se a escrita falhar.
      }
    }
  }

  const favouriteIds = loggedIn
    ? await getUserFavouriteTeamIds().catch(() => [] as number[])
    : [];
  const matches = await loadAllMatches(favouriteIds, loggedIn);

  return <MatchesView matches={matches} canViewChannels={loggedIn} />;
}

export const revalidate = 60;
