import { MatchCard } from "@/components/MatchCard";
import { getKnockoutRounds } from "@/lib/matches";

export default async function EliminatoriasPage() {
  const rounds = await getKnockoutRounds();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Eliminatórias</h1>
        <p className="mt-1 text-zinc-400">Chave completa do torneio</p>
      </div>

      {rounds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 px-6 py-12 text-center">
          <p className="text-lg font-medium text-zinc-300">
            Chave ainda não disponível
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Os jogos eliminatórios serão publicados à medida que o torneio avança.
          </p>
        </div>
      ) : (
        rounds.map((round) => (
          <section key={round.round} className="space-y-3">
            <h2 className="text-lg font-semibold text-white">{round.round}</h2>
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
