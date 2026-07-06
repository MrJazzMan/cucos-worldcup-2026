import type { Metadata } from "next";
import { MatchesView } from "@/components/MatchesView";
import {
  getAllMatches,
  getAllTeams,
  getUserFavouriteTeamIds,
} from "@/lib/matches";
import { getMockMatchesForDate } from "@/lib/mock-data";
import { pageMetadata } from "@/lib/site-metadata";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
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

function mockWindow(
  favouriteIds: number[]
): (Match & { isFavourite?: boolean })[] {
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
  const [matches, teams] = await Promise.all([
    loadAllMatches(favouriteIds),
    getAllTeams().catch(() => [] as Awaited<ReturnType<typeof getAllTeams>>),
  ]);

  return (
    <MatchesView
      matches={matches}
      teams={teams}
      loggedIn={loggedIn}
    />
  );
}

export const metadata: Metadata = pageMetadata({
  title: "Mundial 2026: horários, canais de TV e onde ver em Portugal",
  description:
    "Vê que jogos do Mundial FIFA 2026 há hoje, a que horas em Portugal e em que canal de TV. Resultados ao vivo, grupos e fase final num só sítio.",
  path: "/",
});

export const revalidate = 60;
