import { redirect } from "next/navigation";
import { MatchCard } from "@/components/MatchCard";
import { T } from "@/components/Display";
import { KNOCKOUTS_ENABLED } from "@/lib/features";
import { getKnockoutRounds } from "@/lib/matches";

export default async function EliminatoriasPage() {
  if (!KNOCKOUTS_ENABLED) redirect("/");

  const rounds = await getKnockoutRounds();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          <T k="knockouts.title" />
        </h1>
        <p className="mt-1 text-muted">
          <T k="knockouts.subtitle" />
        </p>
      </div>

      {rounds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-base bg-surface/50 px-6 py-12 text-center">
          <p className="text-lg font-medium text-foreground">
            <T k="knockouts.empty.title" />
          </p>
          <p className="mt-1 text-sm text-muted">
            <T k="knockouts.empty.subtitle" />
          </p>
        </div>
      ) : (
        rounds.map((round) => (
          <section key={round.round} className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">{round.round}</h2>
            {round.matches.map((match) => (
              <MatchCard key={match.fixture_id} match={match} />
            ))}
          </section>
        ))
      )}
    </div>
  );
}

export const revalidate = 300;
