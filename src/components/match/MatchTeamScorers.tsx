"use client";

import { formatGoalMinute } from "@/lib/match-events";
import type { MatchGoalEvent } from "@/types";

type MatchTeamScorersProps = {
  goals: MatchGoalEvent[];
  variant: "card" | "featured";
};

function goalSuffix(detail: string): string {
  if (detail === "Own Goal") return " (og)";
  if (detail === "Penalty") return " (p)";
  return "";
}

export function MatchTeamScorers({ goals, variant }: MatchTeamScorersProps) {
  if (!goals.length) return null;

  const textSize = variant === "featured" ? "text-[11px]" : "text-[10px]";

  return (
    <ul
      className={`mt-1.5 w-full space-y-0.5 ${textSize} leading-snug text-muted`}
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
