"use client";

import { KickoffTime, TeamName } from "@/components/Display";
import { TeamFlag } from "@/components/TeamFlag";
import { useSettings } from "@/components/SettingsProvider";
import type { BracketSlotData } from "@/lib/knockout-bracket-tree";
import type { KnockoutSlotPreview } from "@/lib/knockout-bracket";

type BracketSlotCardProps = {
  data: BracketSlotData;
  tbd: string;
  compact?: boolean;
};

function PreviewCard({
  preview,
  tbd,
  compact,
}: {
  preview: KnockoutSlotPreview;
  tbd: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col justify-center rounded-xl border border-dashed border-border-base bg-surface-2/60 px-2 ${
        compact ? "min-h-[2.75rem] py-1.5" : "min-h-[3.25rem] py-2"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-surface text-[7px] font-bold text-muted">
          ?
        </span>
        <span className="truncate text-[10px] font-semibold text-foreground/80">
          {preview.home}
        </span>
      </div>
      <div className="mt-0.5 flex items-center gap-1.5">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-surface text-[7px] font-bold text-muted">
          ?
        </span>
        <span className="truncate text-[10px] font-semibold text-foreground/80">
          {preview.away}
        </span>
      </div>
      {!compact && (
        <p className="mt-1 text-center text-[8px] uppercase tracking-wide text-muted">
          {tbd}
        </p>
      )}
    </div>
  );
}

export function BracketSlotCard({
  data,
  tbd,
  compact = false,
}: BracketSlotCardProps) {
  const { t } = useSettings();
  const { match, preview } = data;

  if (!match) {
    if (preview) {
      return <PreviewCard preview={preview} tbd={tbd} compact={compact} />;
    }
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-dashed border-border-base bg-surface-2/60 px-2 text-center ${
          compact ? "min-h-[2.75rem] py-2" : "min-h-[3.25rem] py-3"
        }`}
      >
        <p className="text-[9px] font-medium uppercase tracking-wide text-muted">
          {tbd}
        </p>
      </div>
    );
  }

  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const showScore = isLive || isFinished;

  return (
    <article
      className={`w-full rounded-xl border bg-surface shadow-sm ${
        compact ? "min-h-[2.75rem] px-2 py-1.5" : "min-h-[3.25rem] px-2 py-2.5"
      } ${
        isLive
          ? "border-red-500/40 ring-1 ring-red-500/20"
          : "border-border-base"
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-1 text-[8px] font-semibold uppercase tracking-wide text-muted">
        <span className="truncate">
          <KickoffTime utc={match.kickoff_utc} />
        </span>
        {isLive && <span className="text-red-500">{t("status.live")}</span>}
        {isFinished && !isLive && <span>{t("status.finished")}</span>}
      </div>
      <div className="space-y-0.5">
        <div className="flex items-center gap-1">
          <TeamFlag
            name={match.home_team_name}
            teamId={match.home_team_id}
            size={16}
          />
          <span className="min-w-0 flex-1 truncate text-[10px] font-semibold">
            <TeamName name={match.home_team_name} />
          </span>
          {showScore && (
            <span className="text-[10px] font-bold tabular-nums">
              {match.home_score ?? 0}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <TeamFlag
            name={match.away_team_name}
            teamId={match.away_team_id}
            size={16}
          />
          <span className="min-w-0 flex-1 truncate text-[10px] font-semibold">
            <TeamName name={match.away_team_name} />
          </span>
          {showScore && (
            <span className="text-[10px] font-bold tabular-nums">
              {match.away_score ?? 0}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
