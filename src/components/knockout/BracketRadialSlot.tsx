"use client";

import { KickoffTime, MatchCompactDate, TeamName } from "@/components/Display";
import { TeamFlag } from "@/components/TeamFlag";
import { useSettings } from "@/components/SettingsProvider";
import { formatBracketSlotLabel } from "@/lib/knockout-slot-labels";
import type { ResolvedSlotSide } from "@/lib/knockout-qualification";
import type { BracketSlotData } from "@/lib/knockout-bracket-tree";
import type { KnockoutSlotPreview } from "@/lib/knockout-bracket";
import type { RadialRoundKey } from "@/lib/knockout-bracket-radial-layout";

type BracketRadialSlotProps = {
  data: BracketSlotData;
  roundKey: RadialRoundKey;
  matchNumber: number;
  tbd: string;
  highlighted?: boolean;
};

function flagSize(roundKey: RadialRoundKey): number {
  if (roundKey === "final" || roundKey === "third") return 22;
  if (roundKey === "r32") return 16;
  return 18;
}

function PreviewFlag({ side, size }: { side: ResolvedSlotSide; size: number }) {
  if (side.team_name && side.team_id) {
    return (
      <TeamFlag name={side.team_name} teamId={side.team_id} size={size} />
    );
  }

  const label = formatBracketSlotLabel(side.code) ?? side.code;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-border-base bg-surface-2 text-[7px] font-bold text-muted"
      style={{ width: size, height: size }}
      title={label}
    >
      ?
    </div>
  );
}

function PreviewRadial({
  preview,
  roundKey,
}: {
  preview: KnockoutSlotPreview;
  roundKey: RadialRoundKey;
}) {
  const size = flagSize(roundKey);
  const home = preview.homeResolved ?? { code: preview.home };
  const away = preview.awayResolved ?? { code: preview.away };

  if (roundKey === "r32") {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <PreviewFlag side={home} size={size} />
        <PreviewFlag side={away} size={size} />
      </div>
    );
  }

  const resolved = home.team_id ? home : away.team_id ? away : home;
  return <PreviewFlag side={resolved} size={size} />;
}

function MatchRadial({
  match,
  roundKey,
}: {
  match: NonNullable<BracketSlotData["match"]>;
  roundKey: RadialRoundKey;
}) {
  const size = flagSize(roundKey);
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const showScore = isLive || isFinished;

  if (roundKey === "r32" || !isFinished) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-0.5">
          <TeamFlag
            name={match.home_team_name}
            teamId={match.home_team_id}
            size={size}
          />
          {showScore && (
            <span className="text-[9px] font-bold tabular-nums text-foreground">
              {match.home_score ?? 0}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <TeamFlag
            name={match.away_team_name}
            teamId={match.away_team_id}
            size={size}
          />
          {showScore && (
            <span className="text-[9px] font-bold tabular-nums text-foreground">
              {match.away_score ?? 0}
            </span>
          )}
        </div>
      </div>
    );
  }

  const homeWon = (match.home_score ?? 0) > (match.away_score ?? 0);
  const winner = homeWon
    ? { name: match.home_team_name, id: match.home_team_id }
    : { name: match.away_team_name, id: match.away_team_id };

  return <TeamFlag name={winner.name} teamId={winner.id} size={size + 2} />;
}

function slotTitle(data: BracketSlotData, tbd: string): string {
  if (data.match) {
    return `${data.match.home_team_name} vs ${data.match.away_team_name}`;
  }
  if (data.preview) {
    const home = data.preview.homeResolved?.team_name ?? data.preview.home;
    const away = data.preview.awayResolved?.team_name ?? data.preview.away;
    return `${home} vs ${away}`;
  }
  return tbd;
}

export function BracketRadialSlot({
  data,
  roundKey,
  matchNumber,
  tbd,
  highlighted = false,
}: BracketRadialSlotProps) {
  const { t } = useSettings();
  const isCenter = roundKey === "final" || roundKey === "third";
  const title = slotTitle(data, tbd);

  return (
    <div
      className={`group relative flex flex-col items-center ${
        isCenter ? "min-w-[4.5rem]" : ""
      }`}
      title={title}
      aria-label={`M${matchNumber}: ${title}`}
    >
      <div
        className={`flex items-center justify-center rounded-full border bg-surface/95 p-1 shadow-sm backdrop-blur-sm transition-shadow ${
          highlighted
            ? "border-accent ring-2 ring-accent/40"
            : "border-border-base"
        } ${isCenter ? "px-2 py-1.5" : ""} ${
          data.match?.status === "live"
            ? "border-red-500/50 ring-1 ring-red-500/30"
            : ""
        }`}
      >
        {!data.match && data.preview && (
          <PreviewRadial preview={data.preview} roundKey={roundKey} />
        )}
        {!data.match && !data.preview && (
          <span className="px-1 text-[8px] font-semibold uppercase text-muted">
            {tbd}
          </span>
        )}
        {data.match && (
          <MatchRadial match={data.match} roundKey={roundKey} />
        )}
      </div>

      {isCenter && data.match && (
        <div className="mt-1 max-w-[5.5rem] text-center">
          <p className="truncate text-[8px] font-bold uppercase tracking-wide text-muted">
            {roundKey === "final"
              ? t("knockouts.round.final")
              : t("knockouts.round.third")}
          </p>
          <p className="text-[8px] tabular-nums text-muted">
            <MatchCompactDate utc={data.match.kickoff_utc} />
            <span aria-hidden> · </span>
            <KickoffTime utc={data.match.kickoff_utc} />
          </p>
          {roundKey === "final" && (
            <div className="mt-0.5 space-y-0.5 text-[9px] font-semibold">
              <p className="truncate">
                <TeamName name={data.match.home_team_name} />
              </p>
              <p className="truncate">
                <TeamName name={data.match.away_team_name} />
              </p>
            </div>
          )}
        </div>
      )}

      {isCenter && !data.match && data.preview && (
        <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-muted">
          {roundKey === "final"
            ? t("knockouts.round.final")
            : t("knockouts.round.third")}
        </p>
      )}
    </div>
  );
}
