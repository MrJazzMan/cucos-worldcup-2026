import { Skeleton } from "@/components/skeleton/Skeleton";

function StandingsGroupSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-2xl border border-border-base bg-surface shadow-sm"
    >
      <div className="border-b border-border-base px-4 py-2.5">
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="px-2 py-2">
        <div className="mb-2 flex gap-2 px-2">
          <Skeleton className="h-3 w-4" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-3 w-8" />
        </div>
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 border-t border-border-base/60 px-2 py-2"
          >
            <Skeleton className="h-4 w-4 shrink-0" />
            <Skeleton className="size-5 shrink-0 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-5 shrink-0" />
            <Skeleton className="h-4 w-6 shrink-0" />
            <Skeleton className="h-4 w-6 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DayStandingsSkeleton({ groups = 2 }: { groups?: number }) {
  return (
    <section aria-hidden className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Skeleton className="h-6 w-44 sm:h-7 sm:w-52" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: groups }, (_, i) => (
          <StandingsGroupSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
