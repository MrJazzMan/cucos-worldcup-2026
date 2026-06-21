import { MatchTeamsSkeleton } from "@/components/skeleton/MatchTeamsSkeleton";
import { Skeleton } from "@/components/skeleton/Skeleton";

export function MatchCardSkeleton() {
  return (
    <article
      aria-hidden
      className="flex h-full flex-col rounded-2xl border border-border-base bg-surface px-4 py-5 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="size-7 rounded-full" />
      </div>

      <MatchTeamsSkeleton variant="card" />

      <div className="mt-4 flex justify-center">
        <Skeleton className="h-3.5 w-32" />
      </div>

      <div className="mt-auto flex flex-col pt-4">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <Skeleton className="h-6 w-12 rounded-lg" />
          <Skeleton className="h-6 w-14 rounded-lg" />
        </div>
        <div className="mt-2 flex justify-center">
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </article>
  );
}
