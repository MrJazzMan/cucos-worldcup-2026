"use client";

import { useMemo, useState } from "react";
import { BracketRadialSlot } from "@/components/knockout/BracketRadialSlot";
import { useSettings } from "@/components/SettingsProvider";
import type { KnockoutRoundColumn } from "@/lib/knockout-bracket";
import {
  RADIAL_CENTER,
  RADIAL_VIEW_SIZE,
  RADIAL_R_OUTER,
  RADIAL_R_RING,
  buildRadialBracketLayout,
  getHighlightedEdges,
  traceEdgesToRoot,
  type RadialBracketNode,
} from "@/lib/knockout-bracket-radial-layout";

const GUIDE_RING_COUNT = 4;

function slotTitle(node: RadialBracketNode, tbd: string): string {
  const { slot } = node;
  if (slot.match) {
    return `${slot.match.home_team_name} vs ${slot.match.away_team_name}`;
  }
  if (slot.preview) {
    return `${slot.preview.home} vs ${slot.preview.away}`;
  }
  return tbd;
}

type KnockoutBracketRadialProps = {
  columns: KnockoutRoundColumn[];
  preview?: boolean;
};

function edgePath(
  from: RadialBracketNode,
  to: RadialBracketNode
): string {
  const midR =
    (Math.hypot(from.x - RADIAL_CENTER, from.y - RADIAL_CENTER) +
      Math.hypot(to.x - RADIAL_CENTER, to.y - RADIAL_CENTER)) /
    2;

  const fromAngle = Math.atan2(from.y - RADIAL_CENTER, from.x - RADIAL_CENTER);
  const toAngle = Math.atan2(to.y - RADIAL_CENTER, to.x - RADIAL_CENTER);
  const midAngle = (fromAngle + toAngle) / 2;

  const cx = RADIAL_CENTER + midR * Math.cos(midAngle);
  const cy = RADIAL_CENTER + midR * Math.sin(midAngle);

  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
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

  const highlightedEdges = useMemo(
    () => getHighlightedEdges(layout),
    [layout]
  );

  const [hoveredMatch, setHoveredMatch] = useState<number | null>(null);
  const [pinnedMatch, setPinnedMatch] = useState<number | null>(null);
  const activeMatch = pinnedMatch ?? hoveredMatch;

  const activeEdges = useMemo(() => {
    if (activeMatch == null) return new Set<string>();
    const parentOf = new Map<number, number>();
    for (const edge of layout.edges) {
      parentOf.set(edge.from, edge.to);
    }
    return traceEdgesToRoot(activeMatch, parentOf);
  }, [activeMatch, layout.edges]);

  const activeNode = activeMatch
    ? layout.nodeByMatch.get(activeMatch)
    : undefined;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="mb-2 h-4 text-center text-[11px] text-muted">
        {activeNode
          ? `M${activeNode.matchNumber} · ${slotTitle(activeNode, tbd)}`
          : t("knockouts.radialHint")}
      </p>

      <div className="relative aspect-square w-full touch-pan-x touch-pan-y">
        <svg
          viewBox={`0 0 ${RADIAL_VIEW_SIZE} ${RADIAL_VIEW_SIZE}`}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={t("knockouts.title")}
        >
          <defs>
            <radialGradient id="bracket-center-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
              <stop offset="70%" stopColor="var(--accent)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle
            cx={RADIAL_CENTER}
            cy={RADIAL_CENTER}
            r={RADIAL_CENTER * 0.92}
            fill="url(#bracket-center-glow)"
          />

          <circle
            cx={RADIAL_CENTER}
            cy={RADIAL_CENTER}
            r={RADIAL_CENTER * 0.88}
            fill="none"
            stroke="var(--border-base)"
            strokeWidth={1}
            strokeOpacity={0.35}
          />

          {Array.from({ length: GUIDE_RING_COUNT }, (_, i) => RADIAL_R_OUTER - i * RADIAL_R_RING).map(
            (r) => (
              <circle
                key={r}
                cx={RADIAL_CENTER}
                cy={RADIAL_CENTER}
                r={r}
                fill="none"
                stroke="var(--border-base)"
                strokeWidth={1}
                strokeOpacity={0.18}
              />
            )
          )}

          {layout.edges.map((edge) => {
            const from = layout.nodeByMatch.get(edge.from);
            const to = layout.nodeByMatch.get(edge.to);
            if (!from || !to) return null;

            const key = `${edge.from}->${edge.to}`;
            const active =
              highlightedEdges.has(key) || activeEdges.has(key);

            return (
              <path
                key={key}
                d={edgePath(from, to)}
                fill="none"
                stroke={active ? "var(--accent)" : "var(--border-base)"}
                strokeWidth={active ? 2.5 : 1.25}
                strokeOpacity={active ? 0.95 : 0.55}
                strokeLinecap="round"
              />
            );
          })}

          <circle
            cx={RADIAL_CENTER}
            cy={RADIAL_CENTER}
            r={36}
            fill="var(--surface)"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeOpacity={0.6}
          />
          <text
            x={RADIAL_CENTER}
            y={RADIAL_CENTER + 5}
            textAnchor="middle"
            className="fill-accent text-[22px] font-black"
            style={{ fontSize: 22 }}
          >
            WC
          </text>
        </svg>

        {layout.nodes.map((node) => {
          const isCenter = node.roundKey === "final" || node.roundKey === "third";
          const isActive = activeMatch === node.matchNumber;
          const edgeActive =
            isActive ||
            layout.edges.some(
              (e) =>
                e.from === node.matchNumber &&
                (highlightedEdges.has(`${e.from}->${e.to}`) ||
                  activeEdges.has(`${e.from}->${e.to}`))
            );

          return (
            <div
              key={node.matchNumber}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${
                isCenter ? "z-20" : "z-10"
              }`}
              style={{
                left: `${(node.x / RADIAL_VIEW_SIZE) * 100}%`,
                top: `${(node.y / RADIAL_VIEW_SIZE) * 100}%`,
              }}
              tabIndex={0}
              role="button"
              onMouseEnter={() => setHoveredMatch(node.matchNumber)}
              onMouseLeave={() => setHoveredMatch(null)}
              onFocus={() => setHoveredMatch(node.matchNumber)}
              onBlur={() => setHoveredMatch(null)}
              onClick={() => {
                setPinnedMatch((current) =>
                  current === node.matchNumber ? null : node.matchNumber
                );
                setHoveredMatch(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setPinnedMatch((current) =>
                    current === node.matchNumber ? null : node.matchNumber
                  );
                }
              }}
            >
              <BracketRadialSlot
                data={node.slot}
                roundKey={node.roundKey}
                matchNumber={node.matchNumber}
                tbd={tbd}
                highlighted={edgeActive}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
