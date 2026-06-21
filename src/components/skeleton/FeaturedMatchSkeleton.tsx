import { MatchTeamsSkeleton } from "@/components/skeleton/MatchTeamsSkeleton";
import { Skeleton } from "@/components/skeleton/Skeleton";

export function FeaturedMatchSkeleton() {
  return (
    <article
      aria-hidden
      className="rounded-2xl border-2 border-border-base bg-surface px-5 py-6 shadow-sm sm:px-8 sm:py-8"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-7 w-28 rounded-full" />
        <Skeleton className="size-8 rounded-full" />
      </div>

      <MatchTeamsSkeleton variant="featured" />

      <div className="mt-5 flex justify-center">
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
        <Skeleton className="h-6 w-14 rounded-lg" />
        <Skeleton className="h-6 w-16 rounded-lg" />
      </div>

      <div className="mt-3 flex justify-center">
        <Skeleton className="h-3 w-24" />
      </div>
    </article>
  );
}
