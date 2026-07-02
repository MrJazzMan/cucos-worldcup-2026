"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import {
  BracketRadialMatch,
  BracketRadialTeam,
} from "@/components/knockout/BracketRadialSlot";
import { WCTrophy } from "@/components/knockout/WCTrophy";
import { useSettings } from "@/components/SettingsProvider";
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

const LINE = "#8f7350";
const LINE_ACTIVE = "#e8c872";
const LINE_DIM = "rgba(143, 115, 80, 0.35)";

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

function MergePaths({
  connector,
  active,
}: {
  connector: RadialMergeConnector;
  active: boolean;
}) {
  const stroke = active ? LINE_ACTIVE : LINE;
  const width = active ? 2.2 : 1.35;
  const opacity = active ? 1 : 0.72;
  const { fromA, fromB, junction, to } = connector;

  return (
    <g>
      <path
        d={`M ${fromA.x} ${fromA.y} L ${junction.x} ${junction.y} L ${to.x} ${to.y}`}
        fill="none"
        stroke={stroke}
        strokeWidth={width}
        strokeOpacity={opacity}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M ${fromB.x} ${fromB.y} L ${junction.x} ${junction.y}`}
        fill="none"
        stroke={stroke}
        strokeWidth={width}
        strokeOpacity={opacity}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={junction.x}
        cy={junction.y}
        r={active ? 3.2 : 2.2}
        fill={active ? LINE_ACTIVE : "#2a2218"}
        stroke={stroke}
        strokeWidth={1}
      />
    </g>
  );
}

function TeamSpokes({
  layout,
  activeMatches,
}: {
  layout: ReturnType<typeof buildRadialBracketLayout>;
  activeMatches: Set<number>;
}) {
  return (
    <>
      {Array.from(layout.teamSlotsByMatch.entries()).map(([matchNumber, pair]) => {
        const active = activeMatches.has(matchNumber);
        const [home, away] = pair;
        const mid = {
          x: (home.x + away.x) / 2,
          y: (home.y + away.y) / 2,
        };
        const stroke = active ? LINE_ACTIVE : LINE_DIM;

        return (
          <g key={`pair-${matchNumber}`}>
            <path
              d={`M ${home.x} ${home.y} L ${mid.x} ${mid.y} L ${away.x} ${away.y}`}
              fill="none"
              stroke={stroke}
              strokeWidth={active ? 1.4 : 1}
              strokeOpacity={active ? 0.9 : 0.55}
            />
            <path
              d={`M ${home.x} ${home.y} L ${mid.x} ${mid.y}`}
              fill="none"
              stroke={stroke}
              strokeWidth={active ? 1.6 : 1.1}
              strokeOpacity={active ? 0.95 : 0.65}
            />
            <path
              d={`M ${away.x} ${away.y} L ${mid.x} ${mid.y}`}
              fill="none"
              stroke={stroke}
              strokeWidth={active ? 1.6 : 1.1}
              strokeOpacity={active ? 0.95 : 0.65}
            />
          </g>
        );
      })}
    </>
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

  const activeConnectors = useMemo(
    () => getActiveConnectorIds(layout, hoveredMatch),
    [layout, hoveredMatch]
  );

  const activeMatches = useMemo(() => {
    if (hoveredMatch == null) return new Set<number>();
    const matches = new Set<number>([hoveredMatch]);
    for (const connector of layout.connectors) {
      if (!activeConnectors.has(connector.id)) continue;
      const children = connector.id.split("->")[0].split("+").map(Number);
      children.forEach((n) => matches.add(n));
      matches.add(connector.parentMatch);
    }
    return matches;
  }, [activeConnectors, hoveredMatch, layout.connectors]);

  const bindMatch = (matchNumber: number) => ({
    onMouseEnter: () => setHoveredMatch(matchNumber),
    onMouseLeave: () => setHoveredMatch(null),
    onFocus: () => setHoveredMatch(matchNumber),
    onBlur: () => setHoveredMatch(null),
    onClick: () =>
      setHoveredMatch((current) =>
        current === matchNumber ? null : matchNumber
      ),
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setHoveredMatch((current) =>
          current === matchNumber ? null : matchNumber
        );
      }
    },
  });

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="overflow-hidden rounded-[2rem] border border-[#2a2218] bg-[#080808] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-5">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-[#c9a86c] sm:text-xs">
          World Cup 2026
        </p>

        <div className="relative mx-auto aspect-square w-full max-w-3xl touch-pan-x touch-pan-y">
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
                <stop offset="0%" stopColor="#d4af37" stopOpacity="0.28" />
                <stop offset="70%" stopColor="#d4af37" stopOpacity="0.06" />
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
                  stroke={LINE_DIM}
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

            <TeamSpokes layout={layout} activeMatches={activeMatches} />

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

          {layout.teamSlots.map((team) => (
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
                size={36}
                tbd={tbd}
              />
            </div>
          ))}

          {layout.matchNodes.map((node) => {
            if (node.roundKey === "final") return null;

            const size = matchFlagSize(node.roundKey);
            const active = activeMatches.has(node.matchNumber);

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
                  active={active}
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

      <p className="mt-3 text-center text-[10px] text-muted">
        {t("knockouts.radialHint")}
      </p>
    </div>
  );
}
