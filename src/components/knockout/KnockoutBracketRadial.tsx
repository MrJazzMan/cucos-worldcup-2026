"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import {
  BracketRadialTeam,
  BracketRadialWinner,
  winnerFromMatch,
} from "@/components/knockout/BracketRadialSlot";
import { WCTrophy } from "@/components/knockout/WCTrophy";
import { useSettings } from "@/components/SettingsProvider";
import { formatBracketSlotLabel } from "@/lib/knockout-slot-labels";
import type { KnockoutRoundColumn } from "@/lib/knockout-bracket";
import {
  BRACKET_COLORS,
  RADIAL_VIEW_SIZE,
  buildRadialBracketLayout,
  getActiveEdgeKeys,
  getActiveNodeIds,
  type RadialLayoutNode,
  type RadialRoundKey,
} from "@/lib/knockout-bracket-radial-layout";

function winnerFlagSize(roundKey: RadialRoundKey): number {
  switch (roundKey) {
    case "r32":
      return 26;
    case "r16":
      return 30;
    case "qf":
      return 34;
    case "sf":
      return 40;
    default:
      return 28;
  }
}

type KnockoutBracketRadialProps = {
  columns: KnockoutRoundColumn[];
  preview?: boolean;
};

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

  /** Nós internos (R32→SF): apenas pontos, como no preview Python. */
  const internalNodes = useMemo(
    () =>
      [...layout.nodes.values()].filter(
        (n) => !n.isSlot && n.round !== "F"
      ),
    [layout.nodes]
  );

  return (
    <div className="mx-auto w-full max-w-4xl">
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
          {layout.edges.map((edge) => {
            const active = activeEdgeKeys.has(edge.key);
            return (
              <path
                key={edge.key}
                d={edge.pathElbow}
                fill="none"
                stroke={active ? BRACKET_COLORS.path : BRACKET_COLORS.line}
                strokeWidth={active ? 3.2 : 1.4}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2"
          aria-hidden
        >
          <WCTrophy size={76} />
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
              aria-label={nodeTitle(node, tbd)}
              {...bindNode(slotId)}
            >
              <BracketRadialTeam
                slot={node.slot}
                side={side}
                size={30}
                tbd={tbd}
                active={activeNodeIds.has(slotId)}
              />
            </div>
          );
        })}

        {internalNodes.map((node) => {
          const active = activeNodeIds.has(node.id);
          const hasWinner = winnerFromMatch(node.slot) != null;

          return (
            <button
              key={node.id}
              type="button"
              className="absolute z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-transparent p-0"
              style={{
                left: `${(node.x / RADIAL_VIEW_SIZE) * 100}%`,
                top: `${(node.y / RADIAL_VIEW_SIZE) * 100}%`,
              }}
              aria-label={nodeTitle(node, tbd)}
              {...bindNode(node.id)}
            >
              {hasWinner ? (
                <BracketRadialWinner
                  slot={node.slot}
                  size={winnerFlagSize(node.roundKey)}
                  active={active}
                />
              ) : (
                <span
                  className={`block rounded-full transition-colors ${
                    active
                      ? "h-2.5 w-2.5 bg-[#e8c872] shadow-[0_0_8px_rgba(232,200,114,0.55)]"
                      : "h-1.5 w-1.5 bg-[var(--bracket-node)]"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-[10px] text-muted">{activeLabel}</p>
    </div>
  );
}
