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
  BRACKET_COLORS,
  RADIAL_CENTER,
  RADIAL_R_QF,
  RADIAL_R_R16,
  RADIAL_R_R32,
  RADIAL_R_SF,
  RADIAL_VIEW_SIZE,
  buildRadialBracketLayout,
  getActiveEdgeKeys,
  getActiveNodeIds,
  type RadialLayoutNode,
  type RadialRoundKey,
} from "@/lib/knockout-bracket-radial-layout";

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

function nodeTitle(node: RadialLayoutNode, tbd: string): string {
  const matchNumber = node.matchNumber;
  if (matchNumber == null) return tbd;

  if (node.isSlot && node.side) {
    const sideLabel =
      node.side === "home"
        ? node.slot.match?.home_team_name ??
          node.slot.preview?.homeResolved?.team_name ??
          formatBracketSlotLabel(node.slot.preview?.home ?? "") ??
          node.label
        : node.slot.match?.away_team_name ??
          node.slot.preview?.awayResolved?.team_name ??
          formatBracketSlotLabel(node.slot.preview?.away ?? "") ??
          node.label;
    return `M${matchNumber} · ${sideLabel ?? tbd}`;
  }

  if (node.slot.match) {
    return `M${matchNumber} · ${node.slot.match.home_team_name} vs ${node.slot.match.away_team_name}`;
  }
  if (node.slot.preview) {
    const home =
      node.slot.preview.homeResolved?.team_name ??
      formatBracketSlotLabel(node.slot.preview.home) ??
      node.slot.preview.home;
    const away =
      node.slot.preview.awayResolved?.team_name ??
      formatBracketSlotLabel(node.slot.preview.away) ??
      node.slot.preview.away;
    return `M${matchNumber} · ${home} vs ${away}`;
  }
  return `M${matchNumber} · ${tbd}`;
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

  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [pinnedNode, setPinnedNode] = useState<string | null>(null);
  const activeNodeId = pinnedNode ?? hoveredNode;

  const activeEdgeKeys = useMemo(
    () => getActiveEdgeKeys(activeNodeId),
    [activeNodeId]
  );

  const activeNodeIds = useMemo(
    () => getActiveNodeIds(activeNodeId),
    [activeNodeId]
  );

  const activeLabel = useMemo(() => {
    if (activeNodeId == null) return t("knockouts.radialHint");
    const node = layout.nodes.get(activeNodeId);
    if (node) return nodeTitle(node, tbd);
    return t("knockouts.radialHint");
  }, [activeNodeId, layout.nodes, t, tbd]);

  const toggleNode = (nodeId: string) => {
    setPinnedNode((current) => (current === nodeId ? null : nodeId));
  };

  const clearHover = () => {
    if (pinnedNode == null) setHoveredNode(null);
  };

  const bindNode = (nodeId: string) => ({
    onMouseEnter: () => setHoveredNode(nodeId),
    onMouseLeave: clearHover,
    onFocus: () => setHoveredNode(nodeId),
    onBlur: clearHover,
    onClick: () => toggleNode(nodeId),
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleNode(nodeId);
      }
    },
  });

  const internalNodes = useMemo(
    () =>
      [...layout.nodes.values()].filter(
        (n) => !n.isSlot && n.round !== "F"
      ),
    [layout.nodes]
  );

  const matchNodes = useMemo(
    () => internalNodes.filter((n) => n.roundKey !== "r32"),
    [internalNodes]
  );

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-border-base bg-background p-3 shadow-sm sm:p-5">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-muted sm:text-xs">
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
            {[RADIAL_R_R32, RADIAL_R_R16, RADIAL_R_QF, RADIAL_R_SF].map(
              (radius) => (
                <circle
                  key={radius}
                  cx={RADIAL_CENTER}
                  cy={RADIAL_CENTER}
                  r={radius}
                  fill="none"
                  className="stroke-border-base"
                  strokeOpacity={0.35}
                  strokeWidth={1}
                />
              )
            )}

            {layout.edges.map((edge) => {
              const active = activeEdgeKeys.has(edge.key);
              return (
                <path
                  key={edge.key}
                  d={edge.pathElbow}
                  fill="none"
                  stroke={active ? BRACKET_COLORS.path : BRACKET_COLORS.line}
                  strokeWidth={active ? 3 : 1.35}
                  strokeLinecap="round"
                />
              );
            })}

            {internalNodes.map((node) => {
              const active = activeNodeIds.has(node.id);
              return (
                <circle
                  key={`dot-${node.id}`}
                  cx={node.x}
                  cy={node.y}
                  r={active ? 5 : 3}
                  fill={active ? BRACKET_COLORS.path : BRACKET_COLORS.node}
                />
              );
            })}
          </svg>

          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2"
            aria-hidden
          >
            <WCTrophy size={68} />
          </div>

          {layout.teamOrder.map((slotId) => {
            const node = layout.nodes.get(slotId)!;
            const side = node.side ?? "home";

            return (
              <div
                key={slotId}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(node.x / RADIAL_VIEW_SIZE) * 100}%`,
                  top: `${(node.y / RADIAL_VIEW_SIZE) * 100}%`,
                }}
                tabIndex={0}
                role="button"
                {...bindNode(slotId)}
              >
                <BracketRadialTeam
                  slot={node.slot}
                  side={side}
                  size={34}
                  tbd={tbd}
                  active={activeNodeIds.has(slotId)}
                />
              </div>
            );
          })}

          {matchNodes.map((node) => {
            const size = matchFlagSize(node.roundKey);

            return (
              <div
                key={node.id}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(node.x / RADIAL_VIEW_SIZE) * 100}%`,
                  top: `${(node.y / RADIAL_VIEW_SIZE) * 100}%`,
                }}
                tabIndex={0}
                role="button"
                {...bindNode(node.id)}
              >
                <BracketRadialMatch
                  data={node.slot}
                  roundKey={node.roundKey}
                  size={size}
                  tbd={tbd}
                  active={activeNodeIds.has(node.id)}
                />
              </div>
            );
          })}

          {layout.thirdPlace && (
            <div
              key="M103"
              className="absolute z-40 -translate-x-1/2 translate-y-16"
              style={{
                left: `${(layout.thirdPlace.x / RADIAL_VIEW_SIZE) * 100}%`,
                top: `${(layout.thirdPlace.y / RADIAL_VIEW_SIZE) * 100}%`,
              }}
              tabIndex={0}
              role="button"
              {...bindNode("M103")}
            >
              <BracketRadialMatch
                data={layout.thirdPlace.slot}
                roundKey="third"
                size={28}
                tbd={tbd}
                active={activeNodeIds.has("M103")}
              />
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] text-muted">{activeLabel}</p>
    </div>
  );
}
