"use client";

import { KickoffTime, MatchCompactDate, TeamName } from "@/components/Display";
import { TeamFlag } from "@/components/TeamFlag";
import { useSettings } from "@/components/SettingsProvider";
import { isSyntheticFixture } from "@/lib/feeder-teams";
import { formatBracketSlotLabel } from "@/lib/knockout-slot-labels";
import type { ResolvedSlotSide } from "@/lib/knockout-qualification";
import type { BracketSlotData } from "@/lib/knockout-bracket-tree";
import type { KnockoutSlotPreview } from "@/lib/knockout-bracket";
import type { RadialRoundKey } from "@/lib/knockout-bracket-radial-layout";
import { PORTUGAL_TEAM_ID } from "@/lib/world-cup";

type BracketRadialSlotProps = {
  data: BracketSlotData;
  roundKey: RadialRoundKey;
  matchNumber: number;
  tbd: string;
  highlighted?: boolean;
};

function flagSize(roundKey: RadialRoundKey): number {
  if (roundKey === "final" || roundKey === "third") return 22;
  if (roundKey === "r32") return 18;
  return 16;
}

function isKnownTeam(side?: ResolvedSlotSide): boolean {
  if (!side?.team_id || !side.team_name) return false;
  if (isSyntheticFixture(side.team_id)) return false;
  return true;
}

function isPortugalTeam(teamId?: number): boolean {
  return teamId === PORTUGAL_TEAM_ID;
}

function flagRingClass(teamId?: number, highlighted?: boolean): string {
  if (highlighted) return "ring-2 ring-accent/50";
  if (isPortugalTeam(teamId)) return "ring-2 ring-amber-500/55";
  return "";
}

function PreviewFlag({
  side,
  size,
  highlighted,
}: {
  side: ResolvedSlotSide;
  size: number;
  highlighted?: boolean;
}) {
  if (isKnownTeam(side)) {
    return (
      <span className={`inline-flex rounded-full ${flagRingClass(side.team_id, highlighted)}`}>
        <TeamFlag name={side.team_name!} teamId={side.team_id} size={size} />
      </span>
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
  highlighted,
}: {
  preview: KnockoutSlotPreview;
  roundKey: RadialRoundKey;
  highlighted?: boolean;
}) {
  const size = flagSize(roundKey);
  const home = preview.homeResolved ?? { code: preview.home };
  const away = preview.awayResolved ?? { code: preview.away };

  if (roundKey === "r32") {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <PreviewFlag side={home} size={size} highlighted={highlighted} />
        <PreviewFlag side={away} size={size} highlighted={highlighted} />
      </div>
    );
  }

  const resolved = isKnownTeam(home)
    ? home
    : isKnownTeam(away)
      ? away
      : home;
  return <PreviewFlag side={resolved} size={size} highlighted={highlighted} />;
}

function MatchRadial({
  match,
  roundKey,
  highlighted,
}: {
  match: NonNullable<BracketSlotData["match"]>;
  roundKey: RadialRoundKey;
  highlighted?: boolean;
}) {
  const size = flagSize(roundKey);
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const showScore = isLive || isFinished;
  const homeKnown = !isSyntheticFixture(match.home_team_id);
  const awayKnown = !isSyntheticFixture(match.away_team_id);

  if (roundKey === "r32" || !isFinished) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        {homeKnown && (
          <div className="flex items-center gap-0.5">
            <span
              className={`inline-flex rounded-full ${flagRingClass(match.home_team_id, highlighted)}`}
            >
              <TeamFlag
                name={match.home_team_name}
                teamId={match.home_team_id}
                size={size}
              />
            </span>
            {showScore && (
              <span className="text-[9px] font-bold tabular-nums text-foreground">
                {match.home_score ?? 0}
              </span>
            )}
          </div>
        )}
        {awayKnown && (
          <div className="flex items-center gap-0.5">
            <span
              className={`inline-flex rounded-full ${flagRingClass(match.away_team_id, highlighted)}`}
            >
              <TeamFlag
                name={match.away_team_name}
                teamId={match.away_team_id}
                size={size}
              />
            </span>
            {showScore && (
              <span className="text-[9px] font-bold tabular-nums text-foreground">
                {match.away_score ?? 0}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  const homeWon = (match.home_score ?? 0) > (match.away_score ?? 0);
  const winner = homeWon
    ? { name: match.home_team_name, id: match.home_team_id }
    : { name: match.away_team_name, id: match.away_team_id };

  return (
    <span className={`inline-flex rounded-full ${flagRingClass(winner.id, highlighted)}`}>
      <TeamFlag name={winner.name} teamId={winner.id} size={size + 2} />
    </span>
  );
}

function slotTitle(data: BracketSlotData, tbd: string): string {
  if (data.match) {
    return `${data.match.home_team_name} vs ${data.match.away_team_name}`;
  }
  if (data.preview) {
    const home =
      data.preview.homeResolved?.team_name ??
      formatBracketSlotLabel(data.preview.home) ??
      data.preview.home;
    const away =
      data.preview.awayResolved?.team_name ??
      formatBracketSlotLabel(data.preview.away) ??
      data.preview.away;
    return `${home} vs ${away}`;
  }
  return tbd;
}

function shouldUseCompactDot(
  data: BracketSlotData,
  roundKey: RadialRoundKey
): boolean {
  if (roundKey === "r32" || roundKey === "final" || roundKey === "third") {
    return false;
  }

  if (data.match) {
    if (data.match.status === "finished") return false;
    const homeKnown = !isSyntheticFixture(data.match.home_team_id);
    const awayKnown = !isSyntheticFixture(data.match.away_team_id);
    return !homeKnown && !awayKnown;
  }

  if (!data.preview) return true;

  return (
    !isKnownTeam(data.preview.homeResolved) &&
    !isKnownTeam(data.preview.awayResolved)
  );
}

function CompactDot({
  highlighted,
  title,
}: {
  highlighted?: boolean;
  title: string;
}) {
  return (
    <span
      className={`block rounded-full transition-all ${
        highlighted
          ? "h-2.5 w-2.5 bg-accent shadow-[0_0_8px_var(--accent)]"
          : "h-1.5 w-1.5 bg-muted/70"
      }`}
      title={title}
      aria-hidden
    />
  );
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
  const compact = shouldUseCompactDot(data, roundKey);

  if (compact) {
    return (
      <div
        className="flex h-10 w-10 items-center justify-center"
        title={title}
        aria-label={`M${matchNumber}: ${title}`}
      >
        <CompactDot highlighted={highlighted} title={title} />
      </div>
    );
  }

  return (
    <div
      className={`group relative flex flex-col items-center ${
        isCenter ? "min-w-[4.5rem]" : ""
      }`}
      title={title}
      aria-label={`M${matchNumber}: ${title}`}
    >
      <div
        className={`flex items-center justify-center rounded-full border bg-surface/95 shadow-sm backdrop-blur-sm transition-shadow ${
          roundKey === "r32" ? "p-1" : "p-0.5"
        } ${
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
          <PreviewRadial
            preview={data.preview}
            roundKey={roundKey}
            highlighted={highlighted}
          />
        )}
        {!data.match && !data.preview && (
          <span className="px-1.5 py-0.5 text-[7px] font-semibold uppercase text-muted">
            {tbd}
          </span>
        )}
        {data.match && (
          <MatchRadial
            match={data.match}
            roundKey={roundKey}
            highlighted={highlighted}
          />
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
