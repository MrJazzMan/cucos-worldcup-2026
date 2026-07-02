import type { KnockoutRoundColumn, KnockoutSlotPreview } from "@/lib/knockout-bracket";
import {
  fifaSlotLocation,
  SIDE_TREE_SPEC,
  type BracketNodeSpec,
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
  _preview: boolean
): BracketSlotData {
  const match = column.matches[index];
  return {
    match,
    preview: column.previews[index],
  };
}

/**
 * Constrói recursivamente um nó da árvore a partir da especificação FIFA:
 * lê a slot do jogo na coluna+índice certos e desce para os filhos.
 */
function buildNode(
  spec: BracketNodeSpec,
  columns: KnockoutRoundColumn[],
  preview: boolean
): BracketTreeNode {
  const { key, index } = fifaSlotLocation(spec.match);
  const slot = slotAt(getColumn(columns, key), index, preview);

  if (!spec.children) return { slot };

  return {
    slot,
    left: buildNode(spec.children[0], columns, preview),
    right: buildNode(spec.children[1], columns, preview),
  };
}

export function buildSideTree(
  columns: KnockoutRoundColumn[],
  side: "left" | "right",
  preview: boolean
): BracketTreeNode {
  return buildNode(SIDE_TREE_SPEC[side], columns, preview);
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
      preview: finalCol.previews[0],
    },
    third: {
      match: thirdCol.matches[0],
      preview: thirdCol.previews[0],
    },
  };
}
