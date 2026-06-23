/** Rótulo legível para códigos FIFA do bracket (1A, 2B, 3C, …). */
export function formatBracketSlotLabel(code: string): string | null {
  const rankGroup = code.match(/^([12])([A-L])$/);
  if (rankGroup) {
    return `${rankGroup[1]}.º Gr. ${rankGroup[2]}`;
  }

  const thirdGroup = code.match(/^3([A-L])$/);
  if (thirdGroup) {
    return `3.º Gr. ${thirdGroup[1]}`;
  }

  if (code === "3º") return null;

  const winner = code.match(/^V(\d+)$/);
  if (winner) return `V${winner[1]}`;

  return null;
}
