"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import {
  BracketRadialMatch,
  BracketRadialTeam,
} from "@/components/knockout/BracketRadialSlot";
import { WCTrophy } from "@/components/knockout/WCTrophy";
import { useSettings } from "@/components/SettingsProvider";
import { formatBracketSlotLabel } from "@/lib/knockout-slot-labels";
import type { KnockoutRoundColumn } from "@/lib/knockout-bracket";
import {
  RADIAL_CENTER,
  RADIAL_R_QF,
  RADIAL_R_R16,
  RADIAL_R_SF,
  RADIAL_R_TEAMS,
  RADIAL_VIEW_SIZE,
  buildRadialBracketLayout,
  getActiveConnectorIds,
  type RadialMergeConnector,
  type RadialRoundKey,
} from "@/lib/knockout-bracket-radial-layout";

const LINE = "#4a4035";
const LINE_ACTIVE = "#e8c872";

type KnockoutBracketRadialProps = {
  columns: KnockoutRoundColumn[];
  preview?: boolean;
};

function matchFlagSize(roundKey: RadialRoundKey): number {
  switch (roundKey) {
    case "r16":
      return 34;
    case "qf":
      return 38;
    case "sf":
      return 42;
    case "final":
      return 0;
    case "third":
      return 28;
    default:
      return 30;
  }
}

function matchTitle(
  matchNumber: number,
  slot: {
    match?: { home_team_name: string; away_team_name: string };
    preview?: {
      home: string;
      away: string;
      homeResolved?: { team_name?: string };
      awayResolved?: { team_name?: string };
    };
  },
  tbd: string
): string {
  if (slot.match) {
    return `M${matchNumber} · ${slot.match.home_team_name} vs ${slot.match.away_team_name}`;
  }
  if (slot.preview) {
    const home =
      slot.preview.homeResolved?.team_name ??
      formatBracketSlotLabel(slot.preview.home) ??
      slot.preview.home;
    const away =
      slot.preview.awayResolved?.team_name ??
      formatBracketSlotLabel(slot.preview.away) ??
      slot.preview.away;
    return `M${matchNumber} · ${home} vs ${away}`;
  }
  return `M${matchNumber} · ${tbd}`;
}

function MergePaths({
  connector,
  active,
}: {
  connector: RadialMergeConnector;
  active: boolean;
}) {
  const stroke = active ? LINE_ACTIVE : LINE;
  const width = active ? 3 : 1.4;
  const opacity = active ? 1 : 0.38;

  return (
    <g>
      <path
        d={connector.pathA}
        fill="none"
        stroke={stroke}
        strokeWidth={width}
        strokeOpacity={opacity}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={connector.pathB}
        fill="none"
        stroke={stroke}
        strokeWidth={width}
        strokeOpacity={opacity}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export function KnockoutBracketRadial({
  columns,
  preview = false,
}: KnockoutBracketRadialProps) {
  const { t } = useSettings();
  const tbd = t("knockouts.tbd");

  const layout = useMemo(
    () => buildRadialBracketLayout(columns, preview),
    [columns, preview]
  );

  const [hoveredMatch, setHoveredMatch] = useState<number | null>(null);
  const [pinnedMatch, setPinnedMatch] = useState<number | null>(null);
  const activeMatch = pinnedMatch ?? hoveredMatch;

  const activeConnectors = useMemo(
    () => getActiveConnectorIds(layout, activeMatch),
    [layout, activeMatch]
  );

  const activeMatches = useMemo(() => {
    if (activeMatch == null) return new Set<number>();
    const matches = new Set<number>([activeMatch]);
    for (const connector of layout.connectors) {
      if (!activeConnectors.has(connector.id)) continue;
      const children = connector.id.split("->")[0].split("+").map(Number);
      children.forEach((n) => matches.add(n));
      matches.add(connector.parentMatch);
    }
    return matches;
  }, [activeConnectors, activeMatch, layout.connectors]);

  const activeLabel = useMemo(() => {
    if (activeMatch == null) return t("knockouts.radialHint");
    const node = layout.nodeByMatch.get(activeMatch);
    if (node) return matchTitle(activeMatch, node.slot, tbd);
    const pair = layout.teamSlotsByMatch.get(activeMatch);
    if (pair) return matchTitle(activeMatch, pair[0].slot, tbd);
    return t("knockouts.radialHint");
  }, [activeMatch, layout, t, tbd]);

  const toggleMatch = (matchNumber: number) => {
    setPinnedMatch((current) =>
      current === matchNumber ? null : matchNumber
    );
  };

  const clearHover = () => {
    if (pinnedMatch == null) setHoveredMatch(null);
  };

  const bindMatch = (matchNumber: number) => ({
    onMouseEnter: () => setHoveredMatch(matchNumber),
    onMouseLeave: clearHover,
    onFocus: () => setHoveredMatch(matchNumber),
    onBlur: clearHover,
    onClick: () => toggleMatch(matchNumber),
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleMatch(matchNumber);
      }
    },
  });

  const connectorActive = (id: string, matchNumber: number) =>
    activeConnectors.has(id) || activeMatches.has(matchNumber);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="overflow-hidden rounded-[2rem] border border-[#2a2218] bg-[#080808] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-5">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-[#c9a86c] sm:text-xs">
          World Cup 2026
        </p>

        <div
          className="relative mx-auto aspect-square w-full max-w-3xl touch-pan-x touch-pan-y"
          onMouseLeave={clearHover}
        >
          <svg
            viewBox={`0 0 ${RADIAL_VIEW_SIZE} ${RADIAL_VIEW_SIZE}`}
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label={t("knockouts.title")}
          >
            <defs>
              <radialGradient id="wheel-bg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1a1410" stopOpacity="0.95" />
                <stop offset="55%" stopColor="#0d0b09" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#080808" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="wheel-glow" cx="50%" cy="50%" r="42%">
                <stop offset="0%" stopColor="#d4af37" stopOpacity="0.22" />
                <stop offset="70%" stopColor="#d4af37" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect
              x={0}
              y={0}
              width={RADIAL_VIEW_SIZE}
              height={RADIAL_VIEW_SIZE}
              fill="url(#wheel-bg)"
            />

            {[RADIAL_R_TEAMS, RADIAL_R_R16, RADIAL_R_QF, RADIAL_R_SF].map(
              (radius) => (
                <circle
                  key={radius}
                  cx={RADIAL_CENTER}
                  cy={RADIAL_CENTER}
                  r={radius}
                  fill="none"
                  stroke="rgba(74, 64, 53, 0.28)"
                  strokeWidth={1}
                />
              )
            )}

            <circle
              cx={RADIAL_CENTER}
              cy={RADIAL_CENTER}
              r={RADIAL_CENTER * 0.34}
              fill="url(#wheel-glow)"
            />

            {layout.leafConnectors.map((leaf) => {
              const active = activeMatches.has(leaf.matchNumber);
              return (
                <path
                  key={`leaf-${leaf.matchNumber}-${leaf.path.slice(0, 12)}`}
                  d={leaf.path}
                  fill="none"
                  stroke={active ? LINE_ACTIVE : LINE}
                  strokeWidth={active ? 2.4 : 1.2}
                  strokeOpacity={active ? 1 : 0.32}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            {layout.connectors.map((connector) => (
              <MergePaths
                key={connector.id}
                connector={connector}
                active={activeConnectors.has(connector.id)}
              />
            ))}
          </svg>

          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2"
            aria-hidden
          >
            <WCTrophy size={68} />
          </div>

          {layout.teamSlots.map((team) => {
            if (!team.visible) return null;

            return (
              <div
                key={`${team.matchNumber}-${team.side}`}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(team.x / RADIAL_VIEW_SIZE) * 100}%`,
                  top: `${(team.y / RADIAL_VIEW_SIZE) * 100}%`,
                }}
                tabIndex={0}
                role="button"
                {...bindMatch(team.matchNumber)}
              >
                <BracketRadialTeam
                  slot={team.slot}
                  side={team.side}
                  size={34}
                  tbd={tbd}
                  active={activeMatches.has(team.matchNumber)}
                />
              </div>
            );
          })}

          {layout.matchNodes.map((node) => {
            if (node.roundKey === "final" || node.roundKey === "third") {
              return null;
            }

            const size = matchFlagSize(node.roundKey);

            return (
              <div
                key={node.matchNumber}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(node.x / RADIAL_VIEW_SIZE) * 100}%`,
                  top: `${(node.y / RADIAL_VIEW_SIZE) * 100}%`,
                }}
                tabIndex={0}
                role="button"
                {...bindMatch(node.matchNumber)}
              >
                <BracketRadialMatch
                  data={node.slot}
                  roundKey={node.roundKey}
                  size={size}
                  tbd={tbd}
                  active={activeMatches.has(node.matchNumber)}
                />
              </div>
            );
          })}

          {layout.matchNodes
            .filter((node) => node.roundKey === "final" || node.roundKey === "third")
            .map((node) => (
              <div
                key={node.matchNumber}
                className={`absolute z-40 -translate-x-1/2 ${
                  node.roundKey === "final" ? "translate-y-6" : "translate-y-16"
                }`}
                style={{
                  left: `${(node.x / RADIAL_VIEW_SIZE) * 100}%`,
                  top: `${(node.y / RADIAL_VIEW_SIZE) * 100}%`,
                }}
                tabIndex={0}
                role="button"
                {...bindMatch(node.matchNumber)}
              >
                <BracketRadialMatch
                  data={node.slot}
                  roundKey={node.roundKey}
                  size={node.roundKey === "final" ? 34 : 28}
                  tbd={tbd}
                  active={activeMatches.has(node.matchNumber)}
                />
              </div>
            ))}
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] text-muted">{activeLabel}</p>
    </div>
  );
}
