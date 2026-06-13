import { Suspense } from "react";
import { DayNav } from "@/components/DayNav";
import { MatchCard } from "@/components/MatchCard";
import { getDateForOffset, getDayLabel } from "@/lib/timezone";

interface MatchListProps {
  matches: Awaited<ReturnType<typeof import("@/lib/matches").getMatchesForDay>>;
  offset: -1 | 0 | 1;
}

export function MatchList({ matches, offset }: MatchListProps) {
  const date = getDateForOffset(offset);
  const label = getDayLabel(offset);

  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="h-14 animate-pulse rounded-2xl bg-zinc-900" />}>
        <DayNav />
      </Suspense>

      <div className="px-1">
        <h2 className="text-sm font-medium text-zinc-400">
          {label} · {date}
        </h2>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 px-6 py-12 text-center">
          <p className="text-lg font-medium text-zinc-300">Sem jogos neste dia</p>
          <p className="mt-1 text-sm text-zinc-500">
            Selecciona outro dia ou volta mais tarde.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <MatchCard key={match.fixture_id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
