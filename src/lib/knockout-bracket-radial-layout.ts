import type { KnockoutRoundColumn } from "@/lib/knockout-bracket";
import {
  buildSideTree,
  getCenterSlots,
  type BracketSlotData,
  type BracketTreeNode,
} from "@/lib/knockout-bracket-tree";
import {
  SIDE_TREE_SPEC,
  type BracketNodeSpec,
} from "@/lib/knockout-fifa-order";
import type { Match } from "@/types";

export const RADIAL_VIEW_SIZE = 1000;
export const RADIAL_CENTER = RADIAL_VIEW_SIZE / 2;
export const RADIAL_R_OUTER = 400;
export const RADIAL_R_RING = 78;
export const RADIAL_R_THIRD = 118;

export type RadialRoundKey =
  | "r32"
  | "r16"
  | "qf"
  | "sf"
  | "final"
  | "third";

export type RadialBracketNode = {
  matchNumber: number;
  roundKey: RadialRoundKey;
  slot: BracketSlotData;
  x: number;
  y: number;
  depth: number;
};

export type RadialBracketEdge = {
  from: number;
  to: number;
};

export type RadialBracketLayout = {
  nodes: RadialBracketNode[];
  edges: RadialBracketEdge[];
  nodeByMatch: Map<number, RadialBracketNode>;
};

function leafFraction(side: "left" | "right", leafIndex: number): number {
  const count = 8;
  if (side === "left") {
    return 0.5 + (leafIndex + 0.5) / count / 2;
  }
  return (leafIndex + 0.5) / count / 2;
}

function fractionToPosition(fraction: number, radius: number): { x: number; y: number } {
  const angle = fraction * Math.PI * 2 - Math.PI / 2;
  return {
    x: RADIAL_CENTER + radius * Math.cos(angle),
    y: RADIAL_CENTER + radius * Math.sin(angle),
  };
}

const DEPTH_ROUND: RadialRoundKey[] = ["r32", "r16", "qf", "sf"];

type BuiltNode = {
  matchNumber: number;
  roundKey: RadialRoundKey;
  slot: BracketSlotData;
  fraction: number;
  depth: number;
  children?: [BuiltNode, BuiltNode];
};

function buildHalfNode(
  treeNode: BracketTreeNode,
  spec: BracketNodeSpec,
  side: "left" | "right",
  depth: number
): BuiltNode {
  const matchNumber = spec.match;

  if (!spec.children || !treeNode.left || !treeNode.right) {
    const leafOrder = collectLeafMatchNumbers(SIDE_TREE_SPEC[side]);
    const leafIndex = leafOrder.indexOf(matchNumber);
    const fraction = leafFraction(side, leafIndex >= 0 ? leafIndex : 0);
    return {
      matchNumber,
      roundKey: "r32",
      slot: treeNode.slot,
      fraction,
      depth: 0,
    };
  }

  const left = buildHalfNode(treeNode.left, spec.children[0], side, depth + 1);
  const right = buildHalfNode(treeNode.right, spec.children[1], side, depth + 1);
  const nodeDepth = left.depth + 1;

  return {
    matchNumber,
    roundKey: DEPTH_ROUND[nodeDepth] ?? "sf",
    slot: treeNode.slot,
    fraction: (left.fraction + right.fraction) / 2,
    depth: nodeDepth,
    children: [left, right],
  };
}

function collectLeafMatchNumbers(spec: BracketNodeSpec): number[] {
  if (!spec.children) return [spec.match];
  return [
    ...collectLeafMatchNumbers(spec.children[0]),
    ...collectLeafMatchNumbers(spec.children[1]),
  ];
}

function flattenHalf(
  node: BuiltNode,
  out: BuiltNode[],
  edges: RadialBracketEdge[]
): void {
  out.push(node);
  if (!node.children) return;
  for (const child of node.children) {
    edges.push({ from: child.matchNumber, to: node.matchNumber });
    flattenHalf(child, out, edges);
  }
}

function getWinnerTeamId(match: Match): number | null {
  if (match.status !== "finished") return null;
  const home = match.home_score ?? 0;
  const away = match.away_score ?? 0;
  if (home > away) return match.home_team_id;
  if (away > home) return match.away_team_id;
  return null;
}

/** Ligações M101/M102 → final e derrotados das meias → 3.º lugar. */
function addCenterEdges(edges: RadialBracketEdge[]): void {
  edges.push({ from: 101, to: 104 }, { from: 102, to: 104 });
}

export function buildRadialBracketLayout(
  columns: KnockoutRoundColumn[],
  preview: boolean
): RadialBracketLayout {
  const leftTree = buildSideTree(columns, "left", preview);
  const rightTree = buildSideTree(columns, "right", preview);
  const center = getCenterSlots(columns, preview);

  const builtLeft = buildHalfNode(
    leftTree,
    SIDE_TREE_SPEC.left,
    "left",
    0
  );
  const builtRight = buildHalfNode(
    rightTree,
    SIDE_TREE_SPEC.right,
    "right",
    0
  );

  const flat: BuiltNode[] = [];
  const edges: RadialBracketEdge[] = [];
  flattenHalf(builtLeft, flat, edges);
  flattenHalf(builtRight, flat, edges);
  addCenterEdges(edges);

  const finalPos = { x: RADIAL_CENTER, y: RADIAL_CENTER };
  const thirdPos = fractionToPosition(0.5, RADIAL_R_THIRD);

  const nodes: RadialBracketNode[] = flat.map((node) => {
    const radius = RADIAL_R_OUTER - node.depth * RADIAL_R_RING;
    const { x, y } = fractionToPosition(node.fraction, radius);
    return {
      matchNumber: node.matchNumber,
      roundKey: node.roundKey,
      slot: node.slot,
      x,
      y,
      depth: node.depth,
    };
  });

  nodes.push({
    matchNumber: 104,
    roundKey: "final",
    slot: center.final,
    x: finalPos.x,
    y: finalPos.y,
    depth: 4,
  });

  nodes.push({
    matchNumber: 103,
    roundKey: "third",
    slot: center.third,
    x: thirdPos.x,
    y: thirdPos.y,
    depth: 4,
  });

  const nodeByMatch = new Map(nodes.map((n) => [n.matchNumber, n]));

  return { nodes, edges, nodeByMatch };
}

function traceEdgesToRoot(
  start: number,
  parentOf: Map<number, number>
): Set<string> {
  const edges = new Set<string>();
  let current: number | undefined = start;
  while (current != null && parentOf.has(current)) {
    const parent: number = parentOf.get(current)!;
    edges.add(`${current}->${parent}`);
    current = parent;
  }
  return edges;
}

export { traceEdgesToRoot };

export function getHighlightedEdges(layout: RadialBracketLayout): Set<string> {
  const highlighted = new Set<string>();
  const parentOf = new Map<number, number>();
  for (const edge of layout.edges) {
    parentOf.set(edge.from, edge.to);
  }

  for (const node of layout.nodes) {
    const match = node.slot.match;
    if (!match || getWinnerTeamId(match) == null) continue;
    for (const key of traceEdgesToRoot(node.matchNumber, parentOf)) {
      highlighted.add(key);
    }
  }

  return highlighted;
}
