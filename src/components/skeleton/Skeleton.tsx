import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/** Bloco cinzento com shimmer subtil; estático se prefers-reduced-motion. */
export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`skeleton-shimmer rounded-md bg-surface-2 ${className}`.trim()}
      {...props}
    />
  );
}
