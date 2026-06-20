"use client";

import { dateKeyInTz, formatShortMatchDate, timeInTz } from "@/lib/datetime";
import { useSettings } from "@/components/SettingsProvider";

type MatchFinishedKickoffProps = {
  kickoffUtc: string;
  selectedDay?: string;
  showKickoffDate?: boolean;
  variant?: "card" | "featured";
};

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 4.5V8l2.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MatchFinishedKickoff({
  kickoffUtc,
  selectedDay,
  showKickoffDate = false,
  variant = "card",
}: MatchFinishedKickoffProps) {
  const { tz, locale } = useSettings();
  const matchDay = dateKeyInTz(kickoffUtc, tz);
  const includeDate =
    showKickoffDate ||
    selectedDay === undefined ||
    matchDay !== selectedDay;
  const time = timeInTz(kickoffUtc, tz);
  const dateLabel = includeDate
    ? formatShortMatchDate(kickoffUtc, tz, locale)
    : null;
  const textSize = variant === "featured" ? "text-xs" : "text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1 tabular-nums ${textSize} font-medium text-muted`}
    >
      <ClockIcon className="h-3 w-3 shrink-0 opacity-70" />
      {dateLabel && (
        <>
          <span>{dateLabel}</span>
          <span aria-hidden>·</span>
        </>
      )}
      <span>{time}</span>
    </span>
  );
}
