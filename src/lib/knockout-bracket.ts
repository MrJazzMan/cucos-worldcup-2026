import type { Match } from "@/types";

export type KnockoutRoundKey =
  | "r32"
  | "r16"
  | "qf"
  | "sf"
  | "third"
  | "final";

export type KnockoutSlotPreview = {
  home: string;
  away: string;
};

export type KnockoutRoundColumn = {
  key: KnockoutRoundKey;
  round: string;
  labelKey: string;
  matches: Match[];
  slotCount: number;
  previews: KnockoutSlotPreview[];
};

/** Chave prevista FIFA 2026 — placeholders até haver jogos reais. */
const KNOCKOUT_SKELETON: Record<KnockoutRoundKey, KnockoutSlotPreview[]> = {
  r32: [
    { home: "2A", away: "2B" },
    { home: "1E", away: "3º" },
    { home: "1F", away: "2C" },
    { home: "1I", away: "3º" },
    { home: "2E", away: "2I" },
    { home: "1A", away: "3º" },
    { home: "1C", away: "2F" },
    { home: "1L", away: "3º" },
    { home: "1D", away: "3º" },
    { home: "1G", away: "3º" },
    { home: "1B", away: "3º" },
    { home: "1K", away: "3º" },
    { home: "2K", away: "2L" },
    { home: "1H", away: "2J" },
    { home: "2D", away: "2G" },
    { home: "1J", away: "2H" },
  ],
  r16: [
    { home: "V73", away: "V75" },
    { home: "V74", away: "V77" },
    { home: "V76", away: "V78" },
    { home: "V79", away: "V80" },
    { home: "V81", away: "V82" },
    { home: "V83", away: "V84" },
    { home: "V85", away: "V87" },
    { home: "V86", away: "V88" },
  ],
  qf: [
    { home: "V89", away: "V90" },
    { home: "V93", away: "V94" },
    { home: "V91", away: "V92" },
    { home: "V95", away: "V96" },
  ],
  sf: [
    { home: "V97", away: "V98" },
    { home: "V99", away: "V100" },
  ],
  third: [{ home: "D101", away: "D102" }],
  final: [{ home: "V101", away: "V102" }],
};

const ROUND_DEFS: {
  key: KnockoutRoundKey;
  labelKey: string;
  slotCount: number;
  matches: (round: string) => boolean;
}[] = [
  {
    key: "r32",
    labelKey: "knockouts.round.r32",
    slotCount: 16,
    matches: (r) =>
      r.includes("round of 32") || r.includes("32 avos") || r.includes("32avos"),
  },
  {
    key: "r16",
    labelKey: "knockouts.round.r16",
    slotCount: 8,
    matches: (r) =>
      r.includes("round of 16") || r.includes("oitav") || r.includes("16 avos"),
  },
  {
    key: "qf",
    labelKey: "knockouts.round.qf",
    slotCount: 4,
    matches: (r) => r.includes("quarter"),
  },
  {
    key: "sf",
    labelKey: "knockouts.round.sf",
    slotCount: 2,
    matches: (r) => r.includes("semi"),
  },
  {
    key: "third",
    labelKey: "knockouts.round.third",
    slotCount: 1,
    matches: (r) => r.includes("3rd") || r.includes("third"),
  },
  {
    key: "final",
    labelKey: "knockouts.round.final",
    slotCount: 1,
    matches: (r) =>
      r.includes("final") &&
      !r.includes("quarter") &&
      !r.includes("semi") &&
      !r.includes("3rd") &&
      !r.includes("third"),
  },
];

export function isKnockoutRound(round: string | null | undefined): boolean {
  if (!round) return false;
  const r = round.toLowerCase();
  if (r.includes("group")) return false;
  return ROUND_DEFS.some((def) => def.matches(r));
}

/** Chave da ronda eliminatória (r32, r16, …) ou null se não for eliminatória. */
export function knockoutRoundKey(
  round: string | null | undefined
): KnockoutRoundKey | null {
  if (!round) return null;
  const r = round.toLowerCase();
  if (r.includes("group")) return null;
  return ROUND_DEFS.find((def) => def.matches(r))?.key ?? null;
}

export function sortKnockoutRoundNames(rounds: string[]): string[] {
  return [...rounds].sort((a, b) => {
    const ai = ROUND_DEFS.findIndex((d) => d.matches(a.toLowerCase()));
    const bi = ROUND_DEFS.findIndex((d) => d.matches(b.toLowerCase()));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export function buildKnockoutColumns(
  rounds: { round: string; matches: Match[] }[]
): KnockoutRoundColumn[] {
  const byKey = new Map<KnockoutRoundKey, { round: string; matches: Match[] }>();

  for (const { round, matches } of rounds) {
    const r = round.toLowerCase();
    const def = ROUND_DEFS.find((d) => d.matches(r));
    if (!def) continue;

    const existing = byKey.get(def.key);
    if (!existing) {
      byKey.set(def.key, { round, matches: [...matches] });
    } else {
      existing.matches.push(...matches);
      existing.matches.sort(
        (a, b) =>
          new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
      );
    }
  }

  return ROUND_DEFS.map((def) => {
    const data = byKey.get(def.key);
    return {
      key: def.key,
      round: data?.round ?? def.key,
      labelKey: def.labelKey,
      matches: data?.matches ?? [],
      slotCount: def.slotCount,
      previews: KNOCKOUT_SKELETON[def.key],
    };
  });
}
