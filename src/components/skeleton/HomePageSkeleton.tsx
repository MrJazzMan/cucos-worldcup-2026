import { MatchCardSkeleton } from "@/components/skeleton/MatchCardSkeleton";
import { Skeleton } from "@/components/skeleton/Skeleton";

/** Placeholder da homepage enquanto os dados do Supabase ainda não chegaram. */
export function HomePageSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="A carregar jogos"
      className="mx-auto flex w-full max-w-2xl flex-col gap-6"
    >
      <Skeleton className="h-11 w-full rounded-2xl" />

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <MatchCardSkeleton />
          <MatchCardSkeleton />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-4 w-24" />
          </div>
          <MatchCardSkeleton />
        </div>
      </div>
    </div>
  );
}
