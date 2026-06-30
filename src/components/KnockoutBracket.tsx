"use client";

import { KnockoutBracketRadial } from "@/components/knockout/KnockoutBracketRadial";
import type { KnockoutRoundColumn } from "@/lib/knockout-bracket";

type KnockoutBracketProps = {
  columns: KnockoutRoundColumn[];
  preview?: boolean;
};

export function KnockoutBracket({ columns, preview = false }: KnockoutBracketProps) {
  return <KnockoutBracketRadial columns={columns} preview={preview} />;
}
