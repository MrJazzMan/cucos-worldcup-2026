"use client";

import { KickoffTime, TeamName } from "@/components/Display";
import { TeamFlag } from "@/components/TeamFlag";
import { useSettings } from "@/components/SettingsProvider";
import type { KnockoutRoundColumn, KnockoutSlotPreview } from "@/lib/knockout-bracket";
import type { Match } from "@/types";

type KnockoutBracketProps = {
  columns: KnockoutRoundColumn[];
  preview?: boolean;
};

function PreviewSlot({
  preview,
  tbd,
}: {
  preview: KnockoutSlotPreview;
  tbd: string;
}) {
  return (
    <div className="flex min-h-[3.25rem] flex-col justify-center rounded-xl border border-dashed border-border-base bg-surface-2/60 px-2 py-2">
      <div className="flex items-center gap-1.5">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface text-[8px] font-bold text-muted">
          ?
        </span>
        <span className="truncate text-[11px] font-semibold text-foreground/80">
          {preview.home}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface text-[8px] font-bold text-muted">
          ?
        </span>
        <span className="truncate text-[11px] font-semibold text-foreground/80">
          {preview.away}
        </span>
      </div>
      <p className="mt-1 text-center text-[9px] uppercase tracking-wide text-muted">
        {tbd}
      </p>
    </div>
  );
}

function KnockoutSlot({
  match,
  preview,
  tbd,
}: {
  match?: Match;
  preview?: KnockoutSlotPreview;
  tbd: string;
}) {
  const { t } = useSettings();

  if (!match) {
    if (preview) {
      return <PreviewSlot preview={preview} tbd={tbd} />;
    }

    return (
      <div className="flex min-h-[3.25rem] items-center justify-center rounded-xl border border-dashed border-border-base bg-surface-2/60 px-2 py-3 text-center">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
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
      className={`min-h-[3.25rem] rounded-xl border bg-surface px-2 py-2.5 shadow-sm ${
        isLive
          ? "border-red-500/40 ring-1 ring-red-500/20"
          : "border-border-base"
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-1 text-[9px] font-semibold uppercase tracking-wide text-muted">
        <span className="truncate">
          <KickoffTime utc={match.kickoff_utc} />
        </span>
        {isLive && <span className="text-red-500">{t("status.live")}</span>}
        {isFinished && !isLive && <span>{t("status.finished")}</span>}
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <TeamFlag
            name={match.home_team_name}
            teamId={match.home_team_id}
            size={20}
          />
          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold leading-tight">
            <TeamName name={match.home_team_name} />
          </span>
          {showScore && (
            <span className="text-xs font-bold tabular-nums">
              {match.home_score ?? 0}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <TeamFlag
            name={match.away_team_name}
            teamId={match.away_team_id}
            size={20}
          />
          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold leading-tight">
            <TeamName name={match.away_team_name} />
          </span>
          {showScore && (
            <span className="text-xs font-bold tabular-nums">
              {match.away_score ?? 0}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function KnockoutBracket({ columns, preview = false }: KnockoutBracketProps) {
  const { t } = useSettings();
  const tbd = t("knockouts.tbd");

  return (
    <div className="relative -mx-4 sm:mx-0">
      <div className="overflow-x-auto pb-2 sm:pb-4">
        <div className="flex min-w-max gap-3 px-4 sm:gap-4 sm:px-0">
          {columns.map((column) => {
            const slots = Array.from({ length: column.slotCount }, (_, i) => ({
              match: column.matches[i],
              preview: column.previews[i],
            }));

            return (
              <section
                key={column.key}
                className="flex w-36 shrink-0 flex-col sm:w-40"
              >
                <h2 className="sticky top-0 z-10 mb-2 rounded-lg border border-border-base bg-surface px-1 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-foreground sm:text-[11px]">
                  {t(column.labelKey)}
                </h2>
                <div className="flex flex-col gap-2">
                  {slots.map(({ match, preview: slotPreview }, index) => (
                    <KnockoutSlot
                      key={match?.fixture_id ?? `${column.key}-${index}`}
                      match={match}
                      preview={preview && !match ? slotPreview : undefined}
                      tbd={tbd}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] text-muted sm:hidden">
        ← {t("knockouts.scrollHint")} →
      </p>
    </div>
  );
}
