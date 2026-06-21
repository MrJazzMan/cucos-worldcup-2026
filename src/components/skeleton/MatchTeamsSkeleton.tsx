import { Skeleton } from "@/components/skeleton/Skeleton";

const SIZES = {
  card: {
    flag: "size-[68px]",
    name: "h-4 w-16 sm:w-20",
    center: "w-[4.5rem]",
    score: "h-7 w-14",
    gap: "gap-2.5",
    teamGap: "gap-1.5",
  },
  featured: {
    flag: "size-24",
    name: "h-4 w-20 sm:h-5 sm:w-24",
    center: "w-28",
    score: "h-9 w-16",
    gap: "gap-4",
    teamGap: "gap-2",
  },
} as const;

function TeamColumnSkeleton({
  sizes,
}: {
  sizes: (typeof SIZES)[keyof typeof SIZES];
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col items-center text-center ${sizes.teamGap}`}
    >
      <Skeleton className={`${sizes.flag} shrink-0 rounded-full`} />
      <Skeleton className={sizes.name} />
    </div>
  );
}

export function MatchTeamsSkeleton({
  variant,
}: {
  variant: "card" | "featured";
}) {
  const sizes = SIZES[variant];

  return (
    <div className={`flex items-start justify-between ${sizes.gap}`}>
      <TeamColumnSkeleton sizes={sizes} />
      <div
        className={`flex ${sizes.center} shrink-0 flex-col items-center justify-center self-center`}
      >
        <Skeleton className={`${sizes.score} rounded-lg`} />
      </div>
      <TeamColumnSkeleton sizes={sizes} />
    </div>
  );
}
