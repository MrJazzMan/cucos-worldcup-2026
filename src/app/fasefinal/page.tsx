import { KnockoutBracket } from "@/components/KnockoutBracket";
import { MatchCard } from "@/components/MatchCard";
import { T } from "@/components/Display";
import { buildKnockoutColumns } from "@/lib/knockout-bracket";
import {
  getGroupStandings,
  getKnockoutRounds,
  getUserFavouriteTeamIds,
} from "@/lib/matches";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function FaseFinalPage() {
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

  const [rounds, standings] = await Promise.all([
    getKnockoutRounds(),
    getGroupStandings(),
  ]);
  const columns = buildKnockoutColumns(rounds, standings);
  const hasMatches = rounds.some((r) => r.matches.length > 0);

  const roundsWithFavourites = rounds.map((round) => ({
    ...round,
    matches: round.matches.map((m) => ({
      ...m,
      isFavourite:
        favouriteIds.includes(m.home_team_id) ||
        favouriteIds.includes(m.away_team_id),
    })),
  }));

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
        <div className="mx-auto w-full max-w-2xl space-y-6 pt-2">
          <h2 className="text-lg font-semibold text-foreground">
            <T k="knockouts.schedule" />
          </h2>
          {roundsWithFavourites.map((round) => (
            <section key={round.round} className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                {round.round}
              </h3>
              {round.matches.map((match) => (
                <MatchCard
                  key={match.fixture_id}
                  match={match}
                  loggedIn={loggedIn}
                />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export const revalidate = 300;
