import type { KnockoutRoundColumn } from "@/lib/knockout-bracket";
import {
  buildSideTree,
  getCenterSlots,
  type BracketSlotData,
  type BracketTreeNode,
} from "@/lib/knockout-bracket-tree";
import {
  FIFA_MATCH_NUMBERS,
  SIDE_TREE_SPEC,
  type BracketNodeSpec,
} from "@/lib/knockout-fifa-order";

export const RADIAL_VIEW_SIZE = 1000;
export const RADIAL_CENTER = RADIAL_VIEW_SIZE / 2;
export const RADIAL_R_TEAMS = 458;
export const RADIAL_R_R16 = 368;
export const RADIAL_R_QF = 278;
export const RADIAL_R_SF = 188;
export const RADIAL_R_THIRD = 108;

const RADIUS_BY_DEPTH = [RADIAL_R_TEAMS, RADIAL_R_R16, RADIAL_R_QF, RADIAL_R_SF, 0] as const;

export type RadialRoundKey =
  | "r32"
  | "r16"
  | "qf"
  | "sf"
  | "final"
  | "third";

export type RadialTeamSide = "home" | "away";

export type RadialTeamSlot = {
  matchNumber: number;
  side: RadialTeamSide;
  slot: BracketSlotData;
  x: number;
  y: number;
};

export type RadialBracketNode = {
  matchNumber: number;
  roundKey: RadialRoundKey;
  slot: BracketSlotData;
  x: number;
  y: number;
  depth: number;
};

export type RadialMergeConnector = {
  id: string;
  parentMatch: number;
  junction: { x: number; y: number };
  fromA: { x: number; y: number };
  fromB: { x: number; y: number };
  to: { x: number; y: number };
};

export type RadialWheelLayout = {
  teamSlots: RadialTeamSlot[];
  matchNodes: RadialBracketNode[];
  connectors: RadialMergeConnector[];
  nodeByMatch: Map<number, RadialBracketNode>;
  teamSlotsByMatch: Map<number, [RadialTeamSlot, RadialTeamSlot]>;
};

export const RADIAL_MATCH_ORDER = [
  ...collectLeafMatchNumbers(SIDE_TREE_SPEC.left),
  ...collectLeafMatchNumbers(SIDE_TREE_SPEC.right),
] as const;

const DEPTH_ROUND: RadialRoundKey[] = ["r32", "r16", "qf", "sf"];

type BuiltNode = {
  matchNumber: number;
  roundKey: RadialRoundKey;
  slot: BracketSlotData;
  fraction: number;
  depth: number;
  children?: [BuiltNode, BuiltNode];
};

function fractionToPosition(fraction: number, radius: number): { x: number; y: number } {
  const angle = fraction * Math.PI * 2 - Math.PI / 2;
  return {
    x: RADIAL_CENTER + radius * Math.cos(angle),
    y: RADIAL_CENTER + radius * Math.sin(angle),
  };
}

function collectLeafMatchNumbers(spec: BracketNodeSpec): number[] {
  if (!spec.children) return [spec.match];
  return [
    ...collectLeafMatchNumbers(spec.children[0]),
    ...collectLeafMatchNumbers(spec.children[1]),
  ];
}

function leafFraction(side: "left" | "right", leafIndex: number): number {
  const count = 8;
  if (side === "left") {
    return 0.5 + (leafIndex + 0.5) / count / 2;
  }
  return (leafIndex + 0.5) / count / 2;
}

function buildHalfNode(
  treeNode: BracketTreeNode,
  spec: BracketNodeSpec,
  side: "left" | "right"
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

  const left = buildHalfNode(treeNode.left, spec.children[0], side);
  const right = buildHalfNode(treeNode.right, spec.children[1], side);
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

function flattenHalf(
  node: BuiltNode,
  out: BuiltNode[],
  parentEdges: { parent: number; child: number }[]
): void {
  out.push(node);
  if (!node.children) return;
  for (const child of node.children) {
    parentEdges.push({ parent: node.matchNumber, child: child.matchNumber });
    flattenHalf(child, out, parentEdges);
  }
}

function junctionPoint(
  a: { x: number; y: number },
  b: { x: number; y: number },
  parent: { x: number; y: number }
): { x: number; y: number } {
  const ra = Math.hypot(a.x - RADIAL_CENTER, a.y - RADIAL_CENTER);
  const rb = Math.hypot(b.x - RADIAL_CENTER, b.y - RADIAL_CENTER);
  const rp = Math.hypot(parent.x - RADIAL_CENTER, parent.y - RADIAL_CENTER);
  const junctionR = (ra + rb) * 0.46 + rp * 0.08;
  const angleA = Math.atan2(a.y - RADIAL_CENTER, a.x - RADIAL_CENTER);
  const angleB = Math.atan2(b.y - RADIAL_CENTER, b.x - RADIAL_CENTER);
  const angle = (angleA + angleB) / 2;
  return {
    x: RADIAL_CENTER + junctionR * Math.cos(angle),
    y: RADIAL_CENTER + junctionR * Math.sin(angle),
  };
}

function getSlotData(
  columns: KnockoutRoundColumn[],
  matchNumber: number,
  preview: boolean
): BracketSlotData {
  for (const key of Object.keys(FIFA_MATCH_NUMBERS) as (keyof typeof FIFA_MATCH_NUMBERS)[]) {
    const index = (FIFA_MATCH_NUMBERS[key] as readonly number[]).indexOf(matchNumber);
    if (index === -1) continue;
    const column = columns.find((c) => c.key === key);
    if (!column) continue;
    const match = column.matches[index];
    return {
      match,
      preview:
        preview && !match && column.previews[index]
          ? column.previews[index]
          : undefined,
    };
  }
  return {};
}

function buildTeamSlots(
  columns: KnockoutRoundColumn[],
  preview: boolean
): { slots: RadialTeamSlot[]; byMatch: Map<number, [RadialTeamSlot, RadialTeamSlot]> } {
  const slots: RadialTeamSlot[] = [];
  const byMatch = new Map<number, [RadialTeamSlot, RadialTeamSlot]>();

  RADIAL_MATCH_ORDER.forEach((matchNumber, index) => {
    const slot = getSlotData(columns, matchNumber, preview);
    const homeFraction = (index * 2 + 0.5) / 32;
    const awayFraction = (index * 2 + 1.5) / 32;
    const homePos = fractionToPosition(homeFraction, RADIAL_R_TEAMS);
    const awayPos = fractionToPosition(awayFraction, RADIAL_R_TEAMS);

    const home: RadialTeamSlot = {
      matchNumber,
      side: "home",
      slot,
      ...homePos,
    };
    const away: RadialTeamSlot = {
      matchNumber,
      side: "away",
      slot,
      ...awayPos,
    };
    slots.push(home, away);
    byMatch.set(matchNumber, [home, away]);
  });

  return { slots, byMatch };
}

function childAnchor(
  child: BuiltNode,
  layout: {
    teamSlotsByMatch: Map<number, [RadialTeamSlot, RadialTeamSlot]>;
    nodeByMatch: Map<number, RadialBracketNode>;
  }
): { x: number; y: number } {
  if (child.depth === 0) {
    const pair = layout.teamSlotsByMatch.get(child.matchNumber);
    if (!pair) {
      return fractionToPosition(child.fraction, RADIAL_R_TEAMS);
    }
    return {
      x: (pair[0].x + pair[1].x) / 2,
      y: (pair[0].y + pair[1].y) / 2,
    };
  }

  const node = layout.nodeByMatch.get(child.matchNumber);
  if (node) return node;
  const radius = RADIUS_BY_DEPTH[child.depth] ?? RADIAL_R_SF;
  return fractionToPosition(child.fraction, radius);
}

function buildConnectors(
  roots: BuiltNode[],
  layout: {
    teamSlotsByMatch: Map<number, [RadialTeamSlot, RadialTeamSlot]>;
    nodeByMatch: Map<number, RadialBracketNode>;
  }
): RadialMergeConnector[] {
  const connectors: RadialMergeConnector[] = [];

  function walk(node: BuiltNode): void {
    if (!node.children) return;
    const parent = layout.nodeByMatch.get(node.matchNumber);
    if (!parent) return;

    const fromA = childAnchor(node.children[0], layout);
    const fromB = childAnchor(node.children[1], layout);
    const junction = junctionPoint(fromA, fromB, parent);

    connectors.push({
      id: `${node.children[0].matchNumber}+${node.children[1].matchNumber}->${node.matchNumber}`,
      parentMatch: node.matchNumber,
      junction,
      fromA,
      fromB,
      to: parent,
    });

    walk(node.children[0]);
    walk(node.children[1]);
  }

  for (const root of roots) {
    walk(root);
  }

  const final = layout.nodeByMatch.get(104);
  const sf101 = layout.nodeByMatch.get(101);
  const sf102 = layout.nodeByMatch.get(102);
  if (final && sf101 && sf102) {
    connectors.push({
      id: "101+102->104",
      parentMatch: 104,
      junction: junctionPoint(sf101, sf102, final),
      fromA: sf101,
      fromB: sf102,
      to: final,
    });
  }

  return connectors;
}

export function buildRadialBracketLayout(
  columns: KnockoutRoundColumn[],
  preview: boolean
): RadialWheelLayout {
  const leftTree = buildSideTree(columns, "left", preview);
  const rightTree = buildSideTree(columns, "right", preview);
  const center = getCenterSlots(columns, preview);

  const builtLeft = buildHalfNode(leftTree, SIDE_TREE_SPEC.left, "left");
  const builtRight = buildHalfNode(rightTree, SIDE_TREE_SPEC.right, "right");

  const flat: BuiltNode[] = [];
  const parentEdges: { parent: number; child: number }[] = [];
  flattenHalf(builtLeft, flat, parentEdges);
  flattenHalf(builtRight, flat, parentEdges);

  const { slots: teamSlots, byMatch: teamSlotsByMatch } = buildTeamSlots(
    columns,
    preview
  );

  const matchNodes: RadialBracketNode[] = flat
    .filter((node) => node.depth > 0)
    .map((node) => {
      const radius = RADIUS_BY_DEPTH[node.depth] ?? RADIAL_R_SF;
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

  matchNodes.push({
    matchNumber: 104,
    roundKey: "final",
    slot: center.final,
    x: RADIAL_CENTER,
    y: RADIAL_CENTER,
    depth: 4,
  });

  const thirdPos = fractionToPosition(0.5, RADIAL_R_THIRD);
  matchNodes.push({
    matchNumber: 103,
    roundKey: "third",
    slot: center.third,
    x: thirdPos.x,
    y: thirdPos.y,
    depth: 4,
  });

  const nodeByMatch = new Map(matchNodes.map((n) => [n.matchNumber, n]));

  const layoutCtx = { teamSlotsByMatch, nodeByMatch };
  const connectors = buildConnectors([builtLeft, builtRight], layoutCtx);

  return {
    teamSlots,
    matchNodes,
    connectors,
    nodeByMatch,
    teamSlotsByMatch,
  };
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

export function getActiveConnectorIds(
  layout: RadialWheelLayout,
  hoveredMatch: number | null
): Set<string> {
  if (hoveredMatch == null) return new Set();

  const parentOf = buildParentMap(layout);
  const chainMatches = new Set<number>([hoveredMatch]);
  let current: number = hoveredMatch;
  while (parentOf.has(current)) {
    const parent = parentOf.get(current)!;
    chainMatches.add(parent);
    current = parent;
  }

  const active = new Set<string>();
  for (const connector of layout.connectors) {
    const [kids, parentStr] = connector.id.split("->");
    const parent = Number(parentStr);
    const children = kids.split("+").map(Number);
    if (!chainMatches.has(parent)) continue;
    if (children.some((child) => chainMatches.has(child))) {
      active.add(connector.id);
    }
  }

  return active;
}

export function buildParentMap(layout: RadialWheelLayout): Map<number, number> {
  const parentOf = new Map<number, number>();
  for (const connector of layout.connectors) {
    const [left, right] = connector.id.split("->")[0].split("+");
    const parent = connector.parentMatch;
    parentOf.set(Number(left), parent);
    parentOf.set(Number(right), parent);
  }
  return parentOf;
}

export { traceEdgesToRoot };
