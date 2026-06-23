"use client";

import { useId, useMemo, useState } from "react";

interface LineChartPoint {
  date: string;
  value: number;
}

interface LineChartProps {
  data: LineChartPoint[];
  label: string;
  formatDate?: (date: string) => string;
}

const WIDTH = 400;
const HEIGHT = 160;
const PAD = { top: 12, right: 8, bottom: 28, left: 8 };

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function LineChart({ data, label, formatDate }: LineChartProps) {
  const gradientId = useId();
  const [hovered, setHovered] = useState<number | null>(null);

  const chart = useMemo(() => {
    if (data.length === 0) return null;

    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const maxVal = Math.max(1, ...data.map((d) => d.value));

    const coords = data.map((d, i) => ({
      x: PAD.left + (i / Math.max(data.length - 1, 1)) * innerW,
      y: PAD.top + innerH - (d.value / maxVal) * innerH,
      value: d.value,
      date: d.date,
    }));

    const linePath = smoothPath(coords);
    const areaPath =
      coords.length > 0
        ? `${linePath} L ${coords[coords.length - 1].x} ${PAD.top + innerH} L ${coords[0].x} ${PAD.top + innerH} Z`
        : "";

    const labelIndices = [0, Math.floor(data.length / 2), data.length - 1].filter(
      (v, i, arr) => arr.indexOf(v) === i
    );

    return { coords, linePath, areaPath, labelIndices, maxVal };
  }, [data]);

  if (!chart || data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border-base bg-surface-2/50 text-sm text-muted">
        Sem dados
      </div>
    );
  }

  const fmt = formatDate ?? ((d: string) => d.slice(5));

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-40 w-full"
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className="[stop-color:var(--accent)]" stopOpacity="0.25" />
            <stop offset="100%" className="[stop-color:var(--accent)]" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={chart.areaPath} fill={`url(#${gradientId})`} />
        <path
          d={chart.linePath}
          fill="none"
          className="stroke-accent"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {chart.coords.map((pt, i) => (
          <circle
            key={pt.date}
            cx={pt.x}
            cy={pt.y}
            r={hovered === i ? 5 : 3}
            className="fill-accent stroke-surface"
            strokeWidth="2"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(null)}
            tabIndex={0}
            aria-label={`${fmt(pt.date)}: ${pt.value}`}
          />
        ))}

        {chart.labelIndices.map((i) => {
          const pt = chart.coords[i];
          if (!pt) return null;
          return (
            <text
              key={pt.date}
              x={pt.x}
              y={HEIGHT - 6}
              textAnchor="middle"
              className="fill-muted text-[9px]"
            >
              {fmt(pt.date)}
            </text>
          );
        })}
      </svg>

      {hovered !== null && chart.coords[hovered] && (
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-lg bg-surface-2 px-2 py-1 text-xs text-foreground shadow-md ring-1 ring-border-base"
          aria-hidden
        >
          <span className="text-muted">{fmt(chart.coords[hovered].date)}</span>
          <span className="ml-2 font-semibold">{chart.coords[hovered].value}</span>
        </div>
      )}
    </div>
  );
}
