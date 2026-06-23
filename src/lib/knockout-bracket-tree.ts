import type { KnockoutRoundColumn, KnockoutSlotPreview } from "@/lib/knockout-bracket";
import {
  QF_TO_SF_PAIRINGS,
  R16_PAIR_TO_QF_FIFA_INDEX,
  R16_PAIR_TO_QF_LOCAL_INDEX,
  R16_TO_QF_PAIRINGS,
  R32_PAIR_TO_R16_LOCAL_INDEX,
  R32_TO_R16_PAIRINGS,
  R32_TREE_LEAF_ORDER,
} from "@/lib/knockout-fifa-order";
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

function slotAt(
  column: KnockoutRoundColumn,
  index: number,
  preview: boolean
): BracketSlotData {
  const match = column.matches[index];
  return {
    match,
    preview:
      preview && !match && column.previews[index]
        ? column.previews[index]
        : undefined,
  };
}

function roundSlotsAt(
  column: KnockoutRoundColumn,
  indices: readonly number[],
  preview: boolean
): BracketSlotData[] {
  return indices.map((index) => slotAt(column, index, preview));
}

function mergeWithPairings(
  children: BracketTreeNode[],
  slots: BracketSlotData[],
  pairings: readonly (readonly [number, number])[],
  slotIndices: readonly number[]
): BracketTreeNode[] {
  return pairings.map((pair, i) => ({
    slot: slots[slotIndices[i]],
    left: children[pair[0]],
    right: children[pair[1]],
  }));
}

export function buildSideTree(
  columns: KnockoutRoundColumn[],
  side: "left" | "right",
  preview: boolean
): BracketTreeNode {
  const r32 = getColumn(columns, "r32");
  const r16 = getColumn(columns, "r16");
  const sf = getColumn(columns, "sf");

  const r16Base = side === "left" ? 0 : 4;
  const qfFifaIndices = R16_PAIR_TO_QF_FIFA_INDEX[side];
  const sfIndex = side === "left" ? 0 : 1;

  const r32Leaves = roundSlotsAt(
    r32,
    R32_TREE_LEAF_ORDER[side],
    preview
  ).map((slot) => ({ slot }));

  const r16Slots = roundSlotsAt(
    r16,
    [0, 1, 2, 3].map((i) => r16Base + i),
    preview
  );

  const r16Nodes = mergeWithPairings(
    r32Leaves,
    r16Slots,
    R32_TO_R16_PAIRINGS,
    R32_PAIR_TO_R16_LOCAL_INDEX[side]
  );

  const qfSlots = roundSlotsAt(r16, qfFifaIndices, preview);

  const qfNodes = mergeWithPairings(
    r16Nodes,
    qfSlots,
    R16_TO_QF_PAIRINGS[side],
    R16_PAIR_TO_QF_LOCAL_INDEX[side]
  );

  const [sfPair] = QF_TO_SF_PAIRINGS;
  const [sfNode] = mergeWithPairings(
    qfNodes,
    [slotAt(sf, sfIndex, preview)],
    [sfPair],
    [0]
  );

  return sfNode;
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
