"use client";

import { useMemo, useState } from "react";
import { TeamName } from "@/components/Display";
import { TeamFlag } from "@/components/TeamFlag";
import { useSettings } from "@/components/SettingsProvider";
import { resolveTopScorers, type TopScorerRow } from "@/lib/top-scorers";
import type { Match } from "@/types";

const DEFAULT_VISIBLE = 5;
const EXPANDED_VISIBLE = 15;

type TopScorersProps = {
  matches: Match[];
  /** Tabela oficial (API-Football); se vazia, agrega goal_events. */
  officialScorers?: TopScorerRow[];
};

export function TopScorers({
  matches,
  officialScorers = [],
}: TopScorersProps) {
  const { t } = useSettings();
  const [expanded, setExpanded] = useState(false);

  const allScorers = useMemo(
    () => resolveTopScorers(officialScorers, matches, 50),
    [officialScorers, matches]
  );

  if (allScorers.length === 0) return null;

  const visibleCount = expanded ? EXPANDED_VISIBLE : DEFAULT_VISIBLE;
  const visible = allScorers.slice(0, visibleCount);
  const canExpand = allScorers.length > DEFAULT_VISIBLE;
  const hiddenCount = allScorers.length - DEFAULT_VISIBLE;

  return (
    <section
      aria-labelledby="top-scorers-heading"
      className="flex w-full flex-col gap-3"
    >
      <h2
        id="top-scorers-heading"
        className="text-base font-bold text-foreground sm:text-lg"
      >
        {t("topScorers.title")}
      </h2>

      <ol className="overflow-hidden rounded-2xl border border-border-base bg-surface shadow-sm">
        {visible.map((row, index) => (
          <li
            key={`${row.player}-${row.team_id}`}
            className={`flex items-center gap-3 px-4 py-3 ${
              index > 0 ? "border-t border-border-base" : ""
            }`}
          >
            <span className="w-5 shrink-0 text-center text-sm font-bold tabular-nums text-muted">
              {row.rank}
            </span>
            <TeamFlag name={row.team_name} teamId={row.team_id} size={22} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {row.player}
              </p>
              <p className="truncate text-xs text-muted">
                <TeamName name={row.team_name} />
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums text-foreground">
              {row.goals}
              <span aria-hidden className="text-base opacity-70">
                ⚽
              </span>
            </span>
          </li>
        ))}
      </ol>

      {canExpand && !expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-sm font-medium text-primary hover:underline"
        >
          {t("topScorers.showMore").replace("{n}", String(hiddenCount))}
        </button>
      )}
    </section>
  );
}
