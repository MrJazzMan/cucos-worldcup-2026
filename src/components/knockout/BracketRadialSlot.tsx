"use client";

import { TeamFlag } from "@/components/TeamFlag";
import { formatBracketSlotLabel } from "@/lib/knockout-slot-labels";
import type { ResolvedSlotSide } from "@/lib/knockout-qualification";
import type { BracketSlotData } from "@/lib/knockout-bracket-tree";
import type {
  RadialRoundKey,
  RadialTeamSide,
} from "@/lib/knockout-bracket-radial-layout";

type BracketRadialTeamProps = {
  slot: BracketSlotData;
  side: RadialTeamSide;
  size: number;
  tbd: string;
};

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
    return (
      slot.preview.homeResolved ?? { code: slot.preview.home }
    );
  }
  return slot.preview.awayResolved ?? { code: slot.preview.away };
}

export function BracketRadialTeam({
  slot,
  side,
  size,
  tbd,
}: BracketRadialTeamProps) {
  const team = resolveSide(slot, side);
  if (!team) {
    return (
      <div
        className="rounded-full border border-[#5c4d38]/60 bg-[#1a1510]"
        style={{ width: size, height: size }}
        title={tbd}
      />
    );
  }

  if (team.team_name && team.team_id) {
    return (
      <TeamFlag
        name={team.team_name}
        teamId={team.team_id}
        size={size}
        className="shadow-[0_0_12px_rgba(0,0,0,0.45)]"
      />
    );
  }

  const label = formatBracketSlotLabel(team.code) ?? team.code;
  return (
    <div
      className="flex items-center justify-center rounded-full border border-[#5c4d38]/70 bg-[#1a1510] text-[8px] font-bold text-[#c9a86c]"
      style={{ width: size, height: size }}
      title={label}
    >
      ?
    </div>
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
  return home > away
    ? { name: match.home_team_name, id: match.home_team_id }
    : { name: match.away_team_name, id: match.away_team_id };
}

export function BracketRadialMatch({
  data,
  roundKey,
  size,
  tbd,
  active = false,
}: BracketRadialMatchProps) {
  const winner = winnerFromMatch(data);

  if (winner) {
    return (
      <TeamFlag
        name={winner.name}
        teamId={winner.id}
        size={size}
        className={`shadow-[0_0_16px_rgba(0,0,0,0.5)] ${
          active ? "ring-2 ring-[#e8c872]" : ""
        }`}
      />
    );
  }

  if (data.match) {
    const home = data.match.home_team_name;
    const away = data.match.away_team_name;
    const isLive = data.match.status === "live";
    return (
      <div
        className={`flex flex-col items-center gap-0.5 ${
          isLive ? "animate-pulse" : ""
        }`}
        title={`${home} vs ${away}`}
      >
        <TeamFlag
          name={home}
          teamId={data.match.home_team_id}
          size={size - 4}
        />
        <TeamFlag
          name={away}
          teamId={data.match.away_team_id}
          size={size - 4}
        />
      </div>
    );
  }

  if (data.preview) {
    const home = data.preview.homeResolved ?? { code: data.preview.home };
    const away = data.preview.awayResolved ?? { code: data.preview.away };
    const known = home.team_id ? home : away.team_id ? away : null;
    if (known?.team_name && known.team_id) {
      return (
        <TeamFlag
          name={known.team_name}
          teamId={known.team_id}
          size={size}
          className="opacity-90"
        />
      );
    }
  }

  if (roundKey === "final") {
    return null;
  }

  return (
    <div
      className={`rounded-full border border-[#6b5a42] bg-[#16120e] ${
        active ? "bg-[#c9a86c]" : ""
      }`}
      style={{ width: Math.max(8, size / 4), height: Math.max(8, size / 4) }}
      title={tbd}
    />
  );
}
