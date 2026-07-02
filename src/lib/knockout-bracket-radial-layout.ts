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
import type { Match } from "@/types";

export const RADIAL_VIEW_SIZE = 1000;
export const RADIAL_CENTER = RADIAL_VIEW_SIZE / 2;
export const RADIAL_R_TEAMS = 458;
export const RADIAL_R_R16 = 368;
export const RADIAL_R_QF = 278;
export const RADIAL_R_SF = 188;
export const RADIAL_R_THIRD = 108;

const RADIUS_BY_DEPTH = [RADIAL_R_TEAMS, RADIAL_R_R16, RADIAL_R_QF, RADIAL_R_SF, 0] as const;
const LEAF_ANGLE_STEP = 360 / 32;
const TOP_AXIS = 90;

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
  visible: boolean;
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
  pathA: string;
  pathB: string;
};

export type RadialLeafConnector = {
  matchNumber: number;
  path: string;
};

export type RadialWheelLayout = {
  teamSlots: RadialTeamSlot[];
  matchNodes: RadialBracketNode[];
  connectors: RadialMergeConnector[];
  leafConnectors: RadialLeafConnector[];
  nodeByMatch: Map<number, RadialBracketNode>;
  teamSlotsByMatch: Map<number, [RadialTeamSlot, RadialTeamSlot]>;
};

export const LEFT_R32_MATCHES = collectLeafMatchNumbers(SIDE_TREE_SPEC.left);
export const RIGHT_R32_MATCHES = collectLeafMatchNumbers(SIDE_TREE_SPEC.right);

const DEPTH_ROUND: RadialRoundKey[] = ["r32", "r16", "qf", "sf"];

type BuiltNode = {
  matchNumber: number;
  roundKey: RadialRoundKey;
  slot: BracketSlotData;
  fraction: number;
  depth: number;
  children?: [BuiltNode, BuiltNode];
};

function deg2rad(d: number): number {
  return (d * Math.PI) / 180;
}

/** Posição polar no estilo worldcup.observer (0° = direita, 90° = topo). */
function placeAtAngle(angleDeg: number, radius: number): { x: number; y: number } {
  const a = deg2rad(angleDeg);
  return {
    x: RADIAL_CENTER + radius * Math.cos(a),
    y: RADIAL_CENTER - radius * Math.sin(a),
  };
}

function teamAngleDeg(half: "left" | "right", slotInHalf: number): number {
  if (half === "left") {
    return TOP_AXIS + LEAF_ANGLE_STEP / 2 + LEAF_ANGLE_STEP * slotInHalf;
  }
  return TOP_AXIS - LEAF_ANGLE_STEP / 2 - LEAF_ANGLE_STEP * slotInHalf;
}

function fractionFromAngle(angleDeg: number): number {
  const a = deg2rad(angleDeg);
  const x = Math.cos(a);
  const y = -Math.sin(a);
  const angle = Math.atan2(y, x);
  return (angle + Math.PI / 2) / (Math.PI * 2);
}

function collectLeafMatchNumbers(spec: BracketNodeSpec): number[] {
  if (!spec.children) return [spec.match];
  return [
    ...collectLeafMatchNumbers(spec.children[0]),
    ...collectLeafMatchNumbers(spec.children[1]),
  ];
}

function isFinishedWinner(
  slot: BracketSlotData,
  side: RadialTeamSide
): boolean {
  const match = slot.match;
  if (!match || match.status !== "finished") return false;
  const home = match.home_score ?? 0;
  const away = match.away_score ?? 0;
  if (home === away) return false;
  const homeWon = home > away;
  return side === "home" ? homeWon : !homeWon;
}

export function outerTeamVisible(
  slot: BracketSlotData,
  side: RadialTeamSide
): boolean {
  return !isFinishedWinner(slot, side);
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
    const fraction = fractionFromAngle(
      teamAngleDeg(side, (leafIndex >= 0 ? leafIndex : 0) * 2)
    );
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

function polarPoint(angle: number, radius: number): { x: number; y: number } {
  return {
    x: RADIAL_CENTER + radius * Math.cos(angle),
    y: RADIAL_CENTER - radius * Math.sin(angle),
  };
}

/** Caminho em arco radial (modelo worldcup.observer). */
export function connectorPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  centerBend = false
): string {
  const startAngle = Math.atan2(RADIAL_CENTER - y1, x1 - RADIAL_CENTER);
  const endAngle = Math.atan2(RADIAL_CENTER - y2, x2 - RADIAL_CENTER);
  const startRadius = Math.hypot(x1 - RADIAL_CENTER, y1 - RADIAL_CENTER);
  const endRadius = Math.hypot(x2 - RADIAL_CENTER, y2 - RADIAL_CENTER);

  if (endRadius < 1) {
    const control = polarPoint(startAngle, startRadius * 0.42);
    return `M ${x1} ${y1} Q ${control.x} ${control.y} ${x2} ${y2}`;
  }

  const bendRadius = centerBend ? endRadius : (startRadius + endRadius) / 2;
  const startBend = polarPoint(startAngle, bendRadius);
  const endBend = polarPoint(endAngle, bendRadius);
  const rawDelta = endAngle - startAngle;
  const delta = Math.atan2(Math.sin(rawDelta), Math.cos(rawDelta));
  const sweep = delta < 0 ? 1 : 0;

  return [
    `M ${x1} ${y1}`,
    `L ${startBend.x} ${startBend.y}`,
    `A ${bendRadius} ${bendRadius} 0 0 ${sweep} ${endBend.x} ${endBend.y}`,
    `L ${x2} ${y2}`,
  ].join(" ");
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

  const halves: { half: "left" | "right"; matches: number[] }[] = [
    { half: "left", matches: [...LEFT_R32_MATCHES] },
    { half: "right", matches: [...RIGHT_R32_MATCHES] },
  ];

  for (const { half, matches } of halves) {
    let slotInHalf = 0;
    for (const matchNumber of matches) {
      const slot = getSlotData(columns, matchNumber, preview);
      const homePos = placeAtAngle(
        teamAngleDeg(half, slotInHalf),
        RADIAL_R_TEAMS
      );
      const awayPos = placeAtAngle(
        teamAngleDeg(half, slotInHalf + 1),
        RADIAL_R_TEAMS
      );

      const home: RadialTeamSlot = {
        matchNumber,
        side: "home",
        slot,
        ...homePos,
        visible: outerTeamVisible(slot, "home"),
      };
      const away: RadialTeamSlot = {
        matchNumber,
        side: "away",
        slot,
        ...awayPos,
        visible: outerTeamVisible(slot, "away"),
      };
      slots.push(home, away);
      byMatch.set(matchNumber, [home, away]);
      slotInHalf += 2;
    }
  }

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
      return placeAtAngle(TOP_AXIS, RADIAL_R_TEAMS);
    }
    const visible = [pair[0], pair[1]].filter((t) => t.visible);
    if (visible.length === 1) return visible[0];
    if (visible.length === 2) {
      return {
        x: (visible[0].x + visible[1].x) / 2,
        y: (visible[0].y + visible[1].y) / 2,
      };
    }
    return {
      x: (pair[0].x + pair[1].x) / 2,
      y: (pair[0].y + pair[1].y) / 2,
    };
  }

  const node = layout.nodeByMatch.get(child.matchNumber);
  if (node) return node;
  const radius = RADIUS_BY_DEPTH[child.depth] ?? RADIAL_R_SF;
  const angleDeg = child.fraction * 360 - 90;
  return placeAtAngle(angleDeg, radius);
}

function buildLeafConnectors(
  roots: BuiltNode[],
  layout: {
    teamSlotsByMatch: Map<number, [RadialTeamSlot, RadialTeamSlot]>;
    nodeByMatch: Map<number, RadialBracketNode>;
  }
): RadialLeafConnector[] {
  const paths: RadialLeafConnector[] = [];

  function walk(node: BuiltNode): void {
    if (!node.children) return;
    const parent = layout.nodeByMatch.get(node.matchNumber);
    if (!parent) return;

    for (const child of node.children) {
      if (child.depth !== 0) continue;
      const pair = layout.teamSlotsByMatch.get(child.matchNumber);
      if (!pair) continue;
      for (const team of pair) {
        if (!team.visible) continue;
        paths.push({
          matchNumber: child.matchNumber,
          path: connectorPath(team.x, team.y, parent.x, parent.y),
        });
      }
    }

    walk(node.children[0]);
    walk(node.children[1]);
  }

  for (const root of roots) {
    walk(root);
  }

  return paths;
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
    const centerBend = node.matchNumber === 104;

    connectors.push({
      id: `${node.children[0].matchNumber}+${node.children[1].matchNumber}->${node.matchNumber}`,
      parentMatch: node.matchNumber,
      pathA: connectorPath(fromA.x, fromA.y, parent.x, parent.y, centerBend),
      pathB: connectorPath(fromB.x, fromB.y, parent.x, parent.y, centerBend),
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
      pathA: connectorPath(sf101.x, sf101.y, final.x, final.y, true),
      pathB: connectorPath(sf102.x, sf102.y, final.x, final.y, true),
    });
  }

  return connectors;
}

function fractionToPosition(fraction: number, radius: number): { x: number; y: number } {
  const angleDeg = fraction * 360 - 90;
  return placeAtAngle(angleDeg, radius);
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

  const thirdPos = placeAtAngle(270, RADIAL_R_THIRD);
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
  const leafConnectors = buildLeafConnectors([builtLeft, builtRight], layoutCtx);

  return {
    teamSlots,
    matchNodes,
    connectors,
    leafConnectors,
    nodeByMatch,
    teamSlotsByMatch,
  };
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

export function getWinnerTeamId(match: Match): number | null {
  if (match.status !== "finished") return null;
  const home = match.home_score ?? 0;
  const away = match.away_score ?? 0;
  if (home === away) return null;
  return home > away ? match.home_team_id : match.away_team_id;
}
