"use client";

import { TeamFlag } from "@/components/TeamFlag";
import { isSyntheticFixture } from "@/lib/feeder-teams";
import { formatBracketSlotLabel } from "@/lib/knockout-slot-labels";
import type { ResolvedSlotSide } from "@/lib/knockout-qualification";
import type { BracketSlotData } from "@/lib/knockout-bracket-tree";
import type {
  RadialRoundKey,
  RadialTeamSide,
} from "@/lib/knockout-bracket-radial-layout";
import { PORTUGAL_TEAM_ID } from "@/lib/world-cup";

type BracketRadialTeamProps = {
  slot: BracketSlotData;
  side: RadialTeamSide;
  size: number;
  tbd: string;
  active?: boolean;
  eliminated?: boolean;
};

function isKnownTeam(side?: ResolvedSlotSide): boolean {
  if (!side?.team_id || !side.team_name) return false;
  if (isSyntheticFixture(side.team_id)) return false;
  return true;
}

function isPortugalTeam(teamId?: number): boolean {
  return teamId === PORTUGAL_TEAM_ID;
}

function flagRingClass(teamId?: number, active?: boolean): string {
  if (active) return "ring-2 ring-[#e8c872]/80";
  if (isPortugalTeam(teamId)) return "ring-2 ring-amber-500/60";
  return "";
}

function resolveSide(
  slot: BracketSlotData,
  side: RadialTeamSide
): ResolvedSlotSide | null {
  if (slot.match) {
    if (side === "home") {
      return {
        code: slot.match.home_team_name,
        team_id: slot.match.home_team_id,
        team_name: slot.match.home_team_name,
        confirmed: true,
      };
    }
    return {
      code: slot.match.away_team_name,
      team_id: slot.match.away_team_id,
      team_name: slot.match.away_team_name,
      confirmed: true,
    };
  }

  if (!slot.preview) return null;
  if (side === "home") {
    return slot.preview.homeResolved ?? { code: slot.preview.home };
  }
  return slot.preview.awayResolved ?? { code: slot.preview.away };
}

export function BracketRadialTeam({
  slot,
  side,
  size,
  tbd,
  active = false,
  eliminated = false,
}: BracketRadialTeamProps) {
  const team = resolveSide(slot, side);
  if (!team || !isKnownTeam(team)) {
    const label =
      team?.code != null
        ? (formatBracketSlotLabel(team.code) ?? team.code)
        : tbd;
    return (
      <div
        className={`flex items-center justify-center rounded-full border border-[#5c4d38]/70 bg-[#1a1510] text-[8px] font-bold text-[#c9a86c] ${
          eliminated ? "opacity-35" : ""
        }`}
        style={{ width: size, height: size }}
        title={label}
      >
        ?
      </div>
    );
  }

  return (
    <span
      className={`inline-flex rounded-full ${flagRingClass(team.team_id, active)} ${
        eliminated ? "opacity-35 grayscale" : ""
      }`}
    >
      <TeamFlag
        name={team.team_name!}
        teamId={team.team_id}
        size={size}
        className={eliminated ? "" : "shadow-[0_0_12px_rgba(0,0,0,0.45)]"}
      />
    </span>
  );
}

type BracketRadialMatchProps = {
  data: BracketSlotData;
  roundKey: RadialRoundKey;
  size: number;
  tbd: string;
  active?: boolean;
};

function winnerFromMatch(data: BracketSlotData) {
  const match = data.match;
  if (!match || match.status !== "finished") return null;
  const home = match.home_score ?? 0;
  const away = match.away_score ?? 0;
  if (home === away) return null;
  const homeWon = home > away;
  const teamId = homeWon ? match.home_team_id : match.away_team_id;
  if (isSyntheticFixture(teamId)) return null;
  return {
    name: homeWon ? match.home_team_name : match.away_team_name,
    id: teamId,
  };
}

function CompactDot({ active, title }: { active?: boolean; title: string }) {
  return (
    <span
      className={`block rounded-full transition-all ${
        active
          ? "h-2.5 w-2.5 bg-[#e8c872] shadow-[0_0_8px_rgba(232,200,114,0.6)]"
          : "h-1.5 w-1.5 bg-[#6b5a42]/80"
      }`}
      title={title}
      aria-hidden
    />
  );
}

function shouldUseCompactDot(
  data: BracketSlotData,
  roundKey: RadialRoundKey
): boolean {
  if (roundKey === "final" || roundKey === "third") {
    return true;
  }

  if (roundKey === "r32") {
    const match = data.match;
    if (match && (match.status === "finished" || match.status === "live")) {
      return false;
    }
    return true;
  }

  if (data.match) {
    if (data.match.status === "finished") return false;
    const homeKnown = !isSyntheticFixture(data.match.home_team_id);
    const awayKnown = !isSyntheticFixture(data.match.away_team_id);
    if (homeKnown || awayKnown) return false;
    return true;
  }

  if (!data.preview) return true;

  const home = data.preview.homeResolved;
  const away = data.preview.awayResolved;
  if (isKnownTeam(home) || isKnownTeam(away)) return false;
  return true;
}

export function BracketRadialMatch({
  data,
  roundKey,
  size,
  tbd,
  active = false,
}: BracketRadialMatchProps) {
  if (shouldUseCompactDot(data, roundKey)) {
    return (
      <div className="flex h-10 w-10 items-center justify-center" title={tbd}>
        <CompactDot active={active} title={tbd} />
      </div>
    );
  }

  const winner = winnerFromMatch(data);

  if (winner) {
    return (
      <span className={`inline-flex rounded-full ${flagRingClass(winner.id, active)}`}>
        <TeamFlag
          name={winner.name}
          teamId={winner.id}
          size={size}
          className="shadow-[0_0_16px_rgba(0,0,0,0.5)]"
        />
      </span>
    );
  }

  if (data.match) {
    const homeKnown = !isSyntheticFixture(data.match.home_team_id);
    const awayKnown = !isSyntheticFixture(data.match.away_team_id);
    const isLive = data.match.status === "live";

    if (homeKnown && !awayKnown) {
      return (
        <span className={`inline-flex rounded-full ${flagRingClass(data.match.home_team_id, active)}`}>
          <TeamFlag
            name={data.match.home_team_name}
            teamId={data.match.home_team_id}
            size={size}
            className={isLive ? "animate-pulse" : ""}
          />
        </span>
      );
    }

    if (awayKnown && !homeKnown) {
      return (
        <span className={`inline-flex rounded-full ${flagRingClass(data.match.away_team_id, active)}`}>
          <TeamFlag
            name={data.match.away_team_name}
            teamId={data.match.away_team_id}
            size={size}
            className={isLive ? "animate-pulse" : ""}
          />
        </span>
      );
    }

    if (homeKnown || awayKnown) {
      return (
        <div
          className={`flex flex-col items-center gap-0.5 ${
            isLive ? "animate-pulse" : ""
          }`}
          title={`${data.match.home_team_name} vs ${data.match.away_team_name}`}
        >
          {homeKnown && (
            <span
              className={`inline-flex rounded-full ${flagRingClass(data.match.home_team_id, active)}`}
            >
              <TeamFlag
                name={data.match.home_team_name}
                teamId={data.match.home_team_id}
                size={size - 4}
              />
            </span>
          )}
          {awayKnown && (
            <span
              className={`inline-flex rounded-full ${flagRingClass(data.match.away_team_id, active)}`}
            >
              <TeamFlag
                name={data.match.away_team_name}
                teamId={data.match.away_team_id}
                size={size - 4}
              />
            </span>
          )}
        </div>
      );
    }
  }

  if (data.preview) {
    const home = data.preview.homeResolved ?? { code: data.preview.home };
    const away = data.preview.awayResolved ?? { code: data.preview.away };
    const known = isKnownTeam(home) ? home : isKnownTeam(away) ? away : null;
    if (known?.team_name && known.team_id) {
      return (
        <span className={`inline-flex rounded-full ${flagRingClass(known.team_id, active)}`}>
          <TeamFlag
            name={known.team_name}
            teamId={known.team_id}
            size={size}
            className="opacity-90"
          />
        </span>
      );
    }
  }

  if (roundKey === "final") {
    return null;
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center" title={tbd}>
      <CompactDot active={active} title={tbd} />
    </div>
  );
}
