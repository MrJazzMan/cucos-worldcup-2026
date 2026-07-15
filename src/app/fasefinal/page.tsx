import type { Metadata } from "next";
import { connection } from "next/server";
import { KnockoutBracket } from "@/components/KnockoutBracket";
import { KnockoutSchedule } from "@/components/KnockoutSchedule";
import { T } from "@/components/Display";
import { buildKnockoutColumns } from "@/lib/knockout-bracket";
import {
  getAllMatches,
  getGroupStandings,
  getKnockoutRounds,
  getUserFavouriteTeamIds,
} from "@/lib/matches";
import { createSupabaseServer } from "@/lib/supabase/server";
import { pageMetadata } from "@/lib/site-metadata";
import {
  matchesNeedScoreRefresh,
  maybeSyncStaleMatchScores,
} from "@/lib/stale-score-refresh";

export const metadata: Metadata = pageMetadata({
  title: "Fase final do Mundial 2026 — chave eliminatória e horários",
  description:
    "A chave eliminatória do Mundial 2026, dos dezasseis-avos à final. Confrontos, horários em Portugal e canais de TV de cada jogo a eliminar.",
  path: "/fasefinal",
});

export default async function FaseFinalPage() {
  // Pedido a pedido — permite sync live de resultados atrasados.
  await connection();

  const supabase = await createSupabaseServer();
  let loggedIn = false;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    loggedIn = !!user;
  }

  const favouriteIds = loggedIn
    ? await getUserFavouriteTeamIds().catch(() => [] as number[])
    : [];

  let [rounds, standings, allMatches] = await Promise.all([
    getKnockoutRounds(),
    getGroupStandings(),
    getAllMatches(favouriteIds).catch(() => []),
  ]);

  const preliminaryKnockout = rounds.flatMap((r) => r.matches);
  if (matchesNeedScoreRefresh([...preliminaryKnockout, ...allMatches])) {
    const refresh = await maybeSyncStaleMatchScores([
      ...preliminaryKnockout,
      ...allMatches,
    ]);
    if (refresh.attempted && refresh.reason !== "error") {
      [rounds, standings, allMatches] = await Promise.all([
        getKnockoutRounds(),
        getGroupStandings(),
        getAllMatches(favouriteIds).catch(() => []),
      ]);
    }
  }

  const columns = buildKnockoutColumns(rounds, standings);
  const hasMatches = rounds.some((r) => r.matches.length > 0);

  const knockoutMatches = rounds.flatMap((round) =>
    round.matches.map((m) => ({
      ...m,
      isFavourite:
        favouriteIds.includes(m.home_team_id) ||
        favouriteIds.includes(m.away_team_id),
    }))
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          <T k="knockouts.title" />
        </h1>
        {!hasMatches && (
          <p className="mt-1 text-muted">
            <T k="knockouts.previewHint" />
          </p>
        )}
      </div>

      <KnockoutBracket columns={columns} preview={!hasMatches} />

      {hasMatches && (
        <KnockoutSchedule
          matches={knockoutMatches}
          allMatches={allMatches}
          loggedIn={loggedIn}
        />
      )}
    </div>
  );
}
