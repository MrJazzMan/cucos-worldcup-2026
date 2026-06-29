/** Prefixo interno para equipas «vencedor do jogo FIFA N» (ainda por definir). */
export const FEEDER_PLACEHOLDER_PREFIX = "FIFA_WINNER:";

export const SYNTHETIC_FIXTURE_BASE = 900_000_000;

export function syntheticFixtureId(fifaMatchNumber: number): number {
  return SYNTHETIC_FIXTURE_BASE + fifaMatchNumber;
}

export function isSyntheticFixture(fixtureId: number): boolean {
  return (
    fixtureId >= SYNTHETIC_FIXTURE_BASE &&
    fixtureId < SYNTHETIC_FIXTURE_BASE + 200
  );
}

export function feederPlaceholderName(fifaMatchNumber: number): string {
  return `${FEEDER_PLACEHOLDER_PREFIX}${fifaMatchNumber}`;
}

export function feederFifaNumber(name: string): number | null {
  if (!name.startsWith(FEEDER_PLACEHOLDER_PREFIX)) return null;
  const n = Number(name.slice(FEEDER_PLACEHOLDER_PREFIX.length));
  return Number.isFinite(n) ? n : null;
}
