import type { KnockoutRoundColumn, KnockoutSlotPreview } from "@/lib/knockout-bracket";
import type { Match } from "@/types";

export type BracketSlotData = {
  match?: Match;
  preview?: KnockoutSlotPreview;
};

export type BracketTreeNode = {
  slot: BracketSlotData;
  left?: BracketTreeNode;
  right?: BracketTreeNode;
};

function getColumn(
  columns: KnockoutRoundColumn[],
  key: KnockoutRoundColumn["key"]
): KnockoutRoundColumn {
  const col = columns.find((c) => c.key === key);
  if (!col) throw new Error(`Missing knockout column: ${key}`);
  return col;
}

function roundSlots(
  column: KnockoutRoundColumn,
  start: number,
  count: number,
  preview: boolean
): BracketSlotData[] {
  return Array.from({ length: count }, (_, i) => {
    const index = start + i;
    const match = column.matches[index];
    return {
      match,
      preview:
        preview && !match && column.previews[index]
          ? column.previews[index]
          : undefined,
    };
  });
}

function pairLevels(
  leaves: BracketTreeNode[],
  round: BracketSlotData[]
): BracketTreeNode[] {
  const next: BracketTreeNode[] = [];
  for (let i = 0; i < round.length; i++) {
    next.push({
      slot: round[i],
      left: leaves[i * 2],
      right: leaves[i * 2 + 1],
    });
  }
  return next;
}

export function buildSideTree(
  columns: KnockoutRoundColumn[],
  side: "left" | "right",
  preview: boolean
): BracketTreeNode {
  const r32 = getColumn(columns, "r32");
  const r16 = getColumn(columns, "r16");
  const qf = getColumn(columns, "qf");
  const sf = getColumn(columns, "sf");

  const r32Start = side === "left" ? 0 : 8;
  const r16Start = side === "left" ? 0 : 4;
  const qfStart = side === "left" ? 0 : 2;
  const sfIndex = side === "left" ? 0 : 1;

  let nodes: BracketTreeNode[] = roundSlots(r32, r32Start, 8, preview).map(
    (slot) => ({ slot })
  );

  nodes = pairLevels(nodes, roundSlots(r16, r16Start, 4, preview));
  nodes = pairLevels(nodes, roundSlots(qf, qfStart, 2, preview));
  nodes = pairLevels(nodes, [
    {
      match: sf.matches[sfIndex],
      preview:
        preview && !sf.matches[sfIndex]
          ? sf.previews[sfIndex]
          : undefined,
    },
  ]);

  return nodes[0];
}

export function getCenterSlots(
  columns: KnockoutRoundColumn[],
  preview: boolean
): { final: BracketSlotData; third: BracketSlotData } {
  const finalCol = getColumn(columns, "final");
  const thirdCol = getColumn(columns, "third");

  return {
    final: {
      match: finalCol.matches[0],
      preview:
        preview && !finalCol.matches[0]
          ? finalCol.previews[0]
          : undefined,
    },
    third: {
      match: thirdCol.matches[0],
      preview:
        preview && !thirdCol.matches[0]
          ? thirdCol.previews[0]
          : undefined,
    },
  };
}
