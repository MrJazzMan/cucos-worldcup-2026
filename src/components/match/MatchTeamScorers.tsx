"use client";

import { formatGoalMinute } from "@/lib/match-events";
import type { MatchGoalEvent } from "@/types";

type MatchTeamScorersProps = {
  goals: MatchGoalEvent[];
  variant: "card" | "featured" | "schedule";
  align?: "start" | "center" | "end";
};

function goalSuffix(detail: string): string {
  if (detail === "Own Goal") return " (og)";
  if (detail === "Penalty") return " (p)";
  return "";
}

export function MatchTeamScorers({
  goals,
  variant,
  align = "center",
}: MatchTeamScorersProps) {
  if (!goals.length) return null;

  const textSize =
    variant === "featured"
      ? "text-base"
      : variant === "schedule"
        ? "text-[11px]"
        : "text-sm";
  const alignClass =
    align === "end"
      ? "text-right"
      : align === "start"
        ? "text-left"
        : "text-center";

  return (
    <ul
      className={`mt-1 w-full space-y-0.5 ${textSize} leading-snug text-muted ${alignClass}`}
      aria-label="Marcadores"
    >
      {goals.map((goal, index) => (
        <li
          key={`${goal.minute}-${goal.extra ?? 0}-${goal.player}-${index}`}
          className="truncate px-0.5"
          title={`${goal.player} ${formatGoalMinute(goal.minute, goal.extra)}`}
        >
          <span className="text-foreground/90">{goal.player}</span>{" "}
          <span className="tabular-nums">
            {formatGoalMinute(goal.minute, goal.extra)}
            {goalSuffix(goal.detail)}
          </span>
        </li>
      ))}
    </ul>
  );
}
