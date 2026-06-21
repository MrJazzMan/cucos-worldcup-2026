import { Skeleton } from "@/components/skeleton/Skeleton";

function PortugalUpcomingCardSkeleton() {
  return (
    <article
      aria-hidden
      className="flex flex-col gap-2.5 rounded-2xl border border-border-base bg-surface px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:items-start">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-24" />
        </div>

        <div className="flex items-center justify-center gap-3">
          <div className="flex w-20 flex-col items-center gap-1">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-3 w-5" />
          <div className="flex w-20 flex-col items-center gap-1">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-1.5 border-t border-border-base pt-2.5 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
        <Skeleton className="h-6 w-12 rounded-lg" />
        <Skeleton className="h-6 w-14 rounded-lg" />
      </div>
    </article>
  );
}

export function PortugalUpcomingSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <section aria-hidden className="flex w-full flex-col gap-3">
      <Skeleton className="h-6 w-56 sm:h-7 sm:w-64" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: cards }, (_, i) => (
          <PortugalUpcomingCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
