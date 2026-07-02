import type { KnockoutRoundColumn } from "@/lib/knockout-bracket";
import type { BracketSlotData } from "@/lib/knockout-bracket-tree";
import { getCenterSlots } from "@/lib/knockout-bracket-tree";
import {
  fifaSlotLocation,
  resolveFifaSlotData,
} from "@/lib/knockout-fifa-order";
import type { Match } from "@/types";

// --------------------------------------------------------------------------
// Geometry (ported from bracket_layout.py)
// --------------------------------------------------------------------------

export const RADIAL_VIEW_SIZE = 1000;
export const RADIAL_CENTER = RADIAL_VIEW_SIZE / 2;

export const RADIUS = {
  slot: 435,
  R32: 365,
  R16: 290,
  QF: 210,
  SF: 130,
  F: 0,
} as const;

export const RADIAL_R_TEAMS = RADIUS.slot;
export const RADIAL_R_R32 = RADIUS.R32;
export const RADIAL_R_R16 = RADIUS.R16;
export const RADIAL_R_QF = RADIUS.QF;
export const RADIAL_R_SF = RADIUS.SF;
export const RADIAL_R_THIRD = 108;

const HALF_GAP_DEG = 12;
const PAIR_TIGHTEN = 0.42;
const CX = RADIAL_CENTER;
const CY = RADIAL_CENTER;

export const BRACKET_COLORS = {
  bg: "transparent",
  line: "var(--bracket-line)",
  lineDim: "var(--bracket-line)",
  node: "var(--bracket-node)",
  path: "var(--bracket-path)",
  advanced: "#f0ead6",
  eliminated: "#5a5a60",
  trophy: "#F4C95D",
} as const;

// --------------------------------------------------------------------------
// Official FIFA 2026 topology
// --------------------------------------------------------------------------

const R32_SLOTS: Record<string, [string, string]> = {
  M73: ["RU-A", "RU-B"],
  M74: ["W-E", "3rd-ABCDF"],
  M75: ["W-F", "RU-C"],
  M76: ["W-C", "RU-F"],
  M77: ["W-I", "3rd-CDFGH"],
  M78: ["RU-E", "RU-I"],
  M79: ["W-A", "3rd-CEFHI"],
  M80: ["W-L", "3rd-EHIJK"],
  M81: ["W-D", "3rd-BEFIJ"],
  M82: ["W-G", "3rd-AEHIJ"],
  M83: ["RU-K", "RU-L"],
  M84: ["W-H", "RU-J"],
  M85: ["W-B", "3rd-EFGIJ"],
  M86: ["W-J", "RU-H"],
  M87: ["W-K", "3rd-DEIJL"],
  M88: ["RU-D", "RU-G"],
};

const FEED: Record<string, [string, string]> = {
  M89: ["M74", "M77"],
  M90: ["M73", "M75"],
  M91: ["M76", "M78"],
  M92: ["M79", "M80"],
  M93: ["M83", "M84"],
  M94: ["M81", "M82"],
  M95: ["M86", "M88"],
  M96: ["M85", "M87"],
  M97: ["M89", "M90"],
  M98: ["M93", "M94"],
  M99: ["M91", "M92"],
  M100: ["M95", "M96"],
  M101: ["M97", "M98"],
  M102: ["M99", "M100"],
  M104: ["M101", "M102"],
};

const ROOT = "M104";

const ROUND_OF: Record<string, LayoutRound> = {};
for (const m of Object.keys(R32_SLOTS)) ROUND_OF[m] = "R32";
for (const m of ["M89", "M90", "M91", "M92", "M93", "M94", "M95", "M96"]) {
  ROUND_OF[m] = "R16";
}
for (const m of ["M97", "M98", "M99", "M100"]) ROUND_OF[m] = "QF";
for (const m of ["M101", "M102"]) ROUND_OF[m] = "SF";
ROUND_OF.M104 = "F";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type LayoutRound = "slot" | "R32" | "R16" | "QF" | "SF" | "F";

export type RadialRoundKey =
  | "r32"
  | "r16"
  | "qf"
  | "sf"
  | "final"
  | "third";

export type RadialTeamSide = "home" | "away";

type LayoutNode = {
  id: string;
  round: LayoutRound;
  isSlot: boolean;
  label: string | null;
  matchId: string | null;
  children: string[];
  angle: number;
  radius: number;
  x: number;
  y: number;
};

export type RadialLayoutNode = LayoutNode & {
  matchNumber: number | null;
  side: RadialTeamSide | null;
  slot: BracketSlotData;
  roundKey: RadialRoundKey;
};

export type RadialEdge = {
  from: string;
  to: string;
  pathElbow: string;
  key: string;
};

export type RadialWheelLayout = {
  nodes: Map<string, RadialLayoutNode>;
  edges: RadialEdge[];
  teamOrder: string[];
  leftHalf: string[];
  rightHalf: string[];
  thirdPlace: RadialLayoutNode | null;
};

// --------------------------------------------------------------------------
// Static geometry engine
// --------------------------------------------------------------------------

function polar(r: number, angDeg: number): { x: number; y: number } {
  const a = (angDeg * Math.PI) / 180;
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
}

function buildNodes(): Map<string, LayoutNode> {
  const nodes = new Map<string, LayoutNode>();

  for (const [mid, feeders] of Object.entries(FEED)) {
    nodes.set(mid, {
      id: mid,
      round: ROUND_OF[mid],
      isSlot: false,
      label: null,
      matchId: null,
      children: [...feeders],
      angle: 0,
      radius: 0,
      x: 0,
      y: 0,
    });
  }

  for (const [mid, [top, bot]] of Object.entries(R32_SLOTS)) {
    const sa = `${mid}.A`;
    const sb = `${mid}.B`;
    nodes.set(mid, {
      id: mid,
      round: "R32",
      isSlot: false,
      label: null,
      matchId: null,
      children: [sa, sb],
      angle: 0,
      radius: 0,
      x: 0,
      y: 0,
    });
    nodes.set(sa, {
      id: sa,
      round: "slot",
      isSlot: true,
      label: top,
      matchId: mid,
      children: [],
      angle: 0,
      radius: 0,
      x: 0,
      y: 0,
    });
    nodes.set(sb, {
      id: sb,
      round: "slot",
      isSlot: true,
      label: bot,
      matchId: mid,
      children: [],
      angle: 0,
      radius: 0,
      x: 0,
      y: 0,
    });
  }

  return nodes;
}

function inorderSlots(nodes: Map<string, LayoutNode>, nid: string): string[] {
  const node = nodes.get(nid);
  if (!node) return [];
  if (node.isSlot) return [nid];
  const out: string[] = [];
  for (const c of node.children) {
    out.push(...inorderSlots(nodes, c));
  }
  return out;
}

function meanAngleDeg(angles: number[]): number {
  if (angles.length === 0) return 0;
  let sx = 0;
  let sy = 0;
  for (const deg of angles) {
    const rad = (deg * Math.PI) / 180;
    sx += Math.sin(rad);
    sy -= Math.cos(rad);
  }
  const out = (Math.atan2(sx, -sy) * 180) / Math.PI;
  return out < 0 ? out + 360 : out;
}

function assignGeometry(nodes: Map<string, LayoutNode>): string[] {
  const leaves = inorderSlots(nodes, ROOT);
  const n = leaves.length;
  const half = n / 2;
  const halfArc = 180 - HALF_GAP_DEG;
  const step = halfArc / half;

  for (let i = 0; i < leaves.length; i++) {
    const sid = leaves[i];
    const nd = nodes.get(sid)!;
    const side = i < half ? 0 : 1;
    const k = side === 0 ? i : i - half;
    const base = HALF_GAP_DEG / 2 + (k + 0.5) * step;
    const pairCentre = HALF_GAP_DEG / 2 + (Math.floor(k / 2) * 2 + 1) * step;
    let ang = base + (pairCentre - base) * PAIR_TIGHTEN;
    if (side === 1) ang += 180;
    nd.angle = ang;
    nd.radius = RADIUS.slot;
    const pos = polar(nd.radius, ang);
    nd.x = pos.x;
    nd.y = pos.y;
  }

  const order: LayoutRound[] = ["R32", "R16", "QF", "SF", "F"];
  for (const rnd of order) {
    for (const nd of nodes.values()) {
      if (nd.round !== rnd || nd.isSlot) continue;
      const ch = nd.children.map((c) => nodes.get(c)!);
      nd.angle = meanAngleDeg(ch.map((c) => c.angle));
      nd.radius = RADIUS[rnd === "F" ? "F" : rnd];
      if (nd.radius === 0) {
        nd.x = CX;
        nd.y = CY;
      } else {
        const pos = polar(nd.radius, nd.angle);
        nd.x = pos.x;
        nd.y = pos.y;
      }
    }
  }

  return leaves;
}

const STATIC_NODES = buildNodes();
export const TEAM_ORDER = assignGeometry(STATIC_NODES);
export const LEFT_HALF = TEAM_ORDER.slice(TEAM_ORDER.length / 2);
export const RIGHT_HALF = TEAM_ORDER.slice(0, TEAM_ORDER.length / 2);

function shortCw(aFrom: number, aTo: number): boolean {
  return (aTo - aFrom + 360) % 360 < 180;
}

export function connectorPathElbow(aId: string, bId: string): string {
  const A = STATIC_NODES.get(aId)!;
  const B = STATIC_NODES.get(bId)!;
  const outer = A.radius >= B.radius ? A : B;
  const inner = A.radius >= B.radius ? B : A;
  const { x: ox, y: oy } = outer;
  const { x: ix, y: iy } = inner;

  if (inner.radius === 0) {
    return `M ${ox.toFixed(2)} ${oy.toFixed(2)} L ${ix.toFixed(2)} ${iy.toFixed(2)}`;
  }

  const joint = polar(inner.radius, outer.angle);
  const sweep = shortCw(outer.angle, inner.angle) ? 1 : 0;
  const r = inner.radius;
  return [
    `M ${ox.toFixed(2)} ${oy.toFixed(2)}`,
    `L ${joint.x.toFixed(2)} ${joint.y.toFixed(2)}`,
    `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 ${sweep} ${ix.toFixed(2)} ${iy.toFixed(2)}`,
  ].join(" ");
}

function buildStaticEdges(): RadialEdge[] {
  const out: RadialEdge[] = [];
  for (const nd of STATIC_NODES.values()) {
    if (nd.isSlot) continue;
    for (const c of nd.children) {
      out.push({
        from: c,
        to: nd.id,
        pathElbow: connectorPathElbow(c, nd.id),
        key: `${c}->${nd.id}`,
      });
    }
  }
  return out;
}

const STATIC_EDGES = buildStaticEdges();

function buildParentMap(): Map<string, string> {
  const p = new Map<string, string>();
  for (const nd of STATIC_NODES.values()) {
    for (const c of nd.children) {
      p.set(c, nd.id);
    }
  }
  return p;
}

const PARENT_OF = buildParentMap();

export function pathToRoot(nodeId: string): string[] {
  const chain = [nodeId];
  let cur = nodeId;
  while (PARENT_OF.has(cur)) {
    cur = PARENT_OF.get(cur)!;
    chain.push(cur);
  }
  return chain;
}

export function pathEdges(nodeId: string): RadialEdge[] {
  const chain = pathToRoot(nodeId);
  const edges: RadialEdge[] = [];
  for (let i = 0; i < chain.length - 1; i++) {
    const from = chain[i];
    const to = chain[i + 1];
    const edge = STATIC_EDGES.find((e) => e.from === from && e.to === to);
    if (edge) edges.push(edge);
  }
  return edges;
}

export function getActiveEdgeKeys(nodeId: string | null): Set<string> {
  if (!nodeId) return new Set();
  return new Set(pathEdges(nodeId).map((e) => e.key));
}

export function getActiveNodeIds(nodeId: string | null): Set<string> {
  if (!nodeId) return new Set();
  return new Set(pathToRoot(nodeId));
}

// --------------------------------------------------------------------------
// Data mapping
// --------------------------------------------------------------------------

export function matchNumberFromNodeId(id: string): number | null {
  const m = id.match(/^M(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

export function slotSideFromId(id: string): RadialTeamSide | null {
  if (id.endsWith(".A")) return "home";
  if (id.endsWith(".B")) return "away";
  return null;
}

/** Mapeia Mxx.A / Mxx.B para home/away real, respeitando a ordem do quadro FIFA. */
export function teamSideForSlotId(
  slotId: string,
  slot: BracketSlotData
): RadialTeamSide {
  const wantsHome = slotId.endsWith(".A");

  if (!slot.match) {
    return wantsHome ? "home" : "away";
  }

  const preview = slot.preview;
  if (!preview) {
    return wantsHome ? "home" : "away";
  }

  const ph = preview.homeResolved?.team_id;
  const pa = preview.awayResolved?.team_id;
  const mh = slot.match.home_team_id;
  const ma = slot.match.away_team_id;

  if (ph != null && mh === ph) return wantsHome ? "home" : "away";
  if (ph != null && mh === pa) return wantsHome ? "away" : "home";
  if (pa != null && mh === pa) return wantsHome ? "away" : "home";
  if (pa != null && mh === ma && ph == null) return wantsHome ? "home" : "away";

  const pHomeName = preview.homeResolved?.team_name;
  const pAwayName = preview.awayResolved?.team_name;
  if (pHomeName && slot.match.home_team_name === pHomeName) {
    return wantsHome ? "home" : "away";
  }
  if (pHomeName && slot.match.home_team_name === pAwayName) {
    return wantsHome ? "away" : "home";
  }

  return wantsHome ? "home" : "away";
}

function layoutRoundToKey(round: LayoutRound): RadialRoundKey {
  switch (round) {
    case "R32":
      return "r32";
    case "R16":
      return "r16";
    case "QF":
      return "qf";
    case "SF":
      return "sf";
    case "F":
      return "final";
    default:
      return "r32";
  }
}

function getSlotData(
  columns: KnockoutRoundColumn[],
  matchNumber: number,
  _preview: boolean
): BracketSlotData {
  const { key, index } = fifaSlotLocation(matchNumber);
  const column = columns.find((c) => c.key === key);
  if (!column) return {};
  return resolveFifaSlotData(column, index);
}

function enrichNode(
  node: LayoutNode,
  columns: KnockoutRoundColumn[],
  preview: boolean
): RadialLayoutNode {
  const matchNumber = matchNumberFromNodeId(node.id);
  const slot =
    matchNumber != null ? getSlotData(columns, matchNumber, preview) : {};
  const side = node.isSlot
    ? teamSideForSlotId(node.id, slot)
    : slotSideFromId(node.id);

  return {
    ...node,
    matchNumber,
    side,
    slot,
    roundKey: node.isSlot ? "r32" : layoutRoundToKey(node.round),
  };
}

export function buildRadialBracketLayout(
  columns: KnockoutRoundColumn[],
  preview: boolean
): RadialWheelLayout {
  const nodes = new Map<string, RadialLayoutNode>();
  for (const [id, node] of STATIC_NODES) {
    nodes.set(id, enrichNode(node, columns, preview));
  }

  const center = getCenterSlots(columns, preview);
  const thirdPos = polar(180, RADIAL_R_THIRD);
  const thirdPlace: RadialLayoutNode = {
    id: "M103",
    round: "F",
    isSlot: false,
    label: null,
    matchId: "M103",
    children: [],
    angle: 180,
    radius: RADIAL_R_THIRD,
    x: thirdPos.x,
    y: thirdPos.y,
    matchNumber: 103,
    side: null,
    slot: center.third,
    roundKey: "third",
  };

  return {
    nodes,
    edges: STATIC_EDGES,
    teamOrder: TEAM_ORDER,
    leftHalf: LEFT_HALF,
    rightHalf: RIGHT_HALF,
    thirdPlace,
  };
}

export function getWinnerTeamId(match: Match): number | null {
  if (match.status !== "finished") return null;
  const home = match.home_score ?? 0;
  const away = match.away_score ?? 0;
  if (home === away) return null;
  return home > away ? match.home_team_id : match.away_team_id;
}

/** @deprecated Outer ring always shows all 32 teams in the Python layout model. */
export function outerTeamVisible(
  _slot: BracketSlotData,
  _side: RadialTeamSide
): boolean {
  return true;
}
