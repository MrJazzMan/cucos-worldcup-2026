import { DayStandingsSkeleton } from "@/components/skeleton/DayStandingsSkeleton";
import { DayTabsSkeleton } from "@/components/skeleton/DayTabsSkeleton";
import { FeaturedMatchSkeleton } from "@/components/skeleton/FeaturedMatchSkeleton";
import { MatchCardSkeleton } from "@/components/skeleton/MatchCardSkeleton";
import { PortugalUpcomingSkeleton } from "@/components/skeleton/PortugalUpcomingSkeleton";
import { Skeleton } from "@/components/skeleton/Skeleton";

/** Placeholder da homepage enquanto os dados do Supabase ainda não chegaram. */
export function HomePageSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="A carregar jogos"
      className="mx-auto flex w-full max-w-7xl flex-col gap-4"
    >
      <DayTabsSkeleton />

      <div className="flex w-full items-center justify-between gap-2">
        <Skeleton className="h-5 w-48 sm:w-56" />
        <Skeleton className="h-4 w-16" />
      </div>

      <FeaturedMatchSkeleton />

      <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2">
        <MatchCardSkeleton />
        <MatchCardSkeleton />
      </div>

      <PortugalUpcomingSkeleton />
      <DayStandingsSkeleton />
    </div>
  );
}
