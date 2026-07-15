/** Prefixo interno para equipas «vencedor do jogo FIFA N» (ainda por definir). */
export const FEEDER_PLACEHOLDER_PREFIX = "FIFA_WINNER:";
/** Prefixo interno para equipas «perdedor do jogo FIFA N» (ex.: 3.º/4.º lugar). */
export const FEEDER_LOSER_PLACEHOLDER_PREFIX = "FIFA_LOSER:";

export const SYNTHETIC_FIXTURE_BASE = 900_000_000;

export type FeederKind = "winner" | "loser";

export type FeederPlaceholder = {
  fifa: number;
  kind: FeederKind;
};

export function syntheticFixtureId(fifaMatchNumber: number): number {
  return SYNTHETIC_FIXTURE_BASE + fifaMatchNumber;
}

export function isSyntheticFixture(fixtureId: number): boolean {
  return (
    fixtureId >= SYNTHETIC_FIXTURE_BASE &&
    fixtureId < SYNTHETIC_FIXTURE_BASE + 200
  );
}

export function feederPlaceholderName(
  fifaMatchNumber: number,
  kind: FeederKind = "winner"
): string {
  const prefix =
    kind === "loser"
      ? FEEDER_LOSER_PLACEHOLDER_PREFIX
      : FEEDER_PLACEHOLDER_PREFIX;
  return `${prefix}${fifaMatchNumber}`;
}

export function isFeederPlaceholderName(name: string): boolean {
  return (
    name.startsWith(FEEDER_PLACEHOLDER_PREFIX) ||
    name.startsWith(FEEDER_LOSER_PLACEHOLDER_PREFIX)
  );
}

export function parseFeederPlaceholder(
  name: string
): FeederPlaceholder | null {
  if (name.startsWith(FEEDER_LOSER_PLACEHOLDER_PREFIX)) {
    const n = Number(name.slice(FEEDER_LOSER_PLACEHOLDER_PREFIX.length));
    return Number.isFinite(n) ? { fifa: n, kind: "loser" } : null;
  }
  if (name.startsWith(FEEDER_PLACEHOLDER_PREFIX)) {
    const n = Number(name.slice(FEEDER_PLACEHOLDER_PREFIX.length));
    return Number.isFinite(n) ? { fifa: n, kind: "winner" } : null;
  }
  return null;
}

export function feederFifaNumber(name: string): number | null {
  return parseFeederPlaceholder(name)?.fifa ?? null;
}
