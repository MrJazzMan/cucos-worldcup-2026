import { Skeleton } from "@/components/skeleton/Skeleton";

const TAB_WIDTHS = ["w-14", "w-12", "w-16", "w-14", "w-[4.5rem]", "w-14", "w-16"];

export function DayTabsSkeleton() {
  return (
    <div
      aria-hidden
      className="flex w-full gap-1.5 overflow-hidden rounded-2xl border border-border-base bg-surface p-1.5"
    >
      {TAB_WIDTHS.map((w, i) => (
        <Skeleton key={i} className={`h-10 shrink-0 rounded-xl ${w} md:min-w-0 md:flex-1`} />
      ))}
    </div>
  );
}
