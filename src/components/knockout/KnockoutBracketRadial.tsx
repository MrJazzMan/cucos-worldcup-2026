"use client";

import { useMemo, useState } from "react";
import { BracketRadialSlot } from "@/components/knockout/BracketRadialSlot";
import { useSettings } from "@/components/SettingsProvider";
import type { KnockoutRoundColumn } from "@/lib/knockout-bracket";
import {
  RADIAL_CENTER,
  RADIAL_VIEW_SIZE,
  buildRadialBracketLayout,
  traceEdgesToRoot,
  type RadialBracketNode,
} from "@/lib/knockout-bracket-radial-layout";

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

  const [hoveredMatch, setHoveredMatch] = useState<number | null>(null);

  const activeEdges = useMemo(() => {
    if (hoveredMatch == null) return new Set<string>();
    const parentOf = new Map<number, number>();
    for (const edge of layout.edges) {
      parentOf.set(edge.from, edge.to);
    }
    return traceEdgesToRoot(hoveredMatch, parentOf);
  }, [hoveredMatch, layout.edges]);

  return (
    <div className="mx-auto w-full max-w-2xl">
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

          {layout.edges.map((edge) => {
            const from = layout.nodeByMatch.get(edge.from);
            const to = layout.nodeByMatch.get(edge.to);
            if (!from || !to) return null;

            const key = `${edge.from}->${edge.to}`;
            const active = activeEdges.has(key);

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
          const edgeActive = layout.edges.some(
            (e) =>
              e.from === node.matchNumber &&
              activeEdges.has(`${e.from}->${e.to}`)
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
              onClick={() =>
                setHoveredMatch((current) =>
                  current === node.matchNumber ? null : node.matchNumber
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setHoveredMatch((current) =>
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
                highlighted={edgeActive && node.roundKey !== "r32"}
              />
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-[10px] text-muted">
        {t("knockouts.radialHint")}
      </p>
    </div>
  );
}
