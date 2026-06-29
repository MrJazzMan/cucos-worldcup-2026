import { mergeBroadcastChannels } from "@/lib/channels";

/**
 * Canais confirmados manualmente quando o OndeBola ainda não tem o jogo.
 * Fonte: Sofascore / Sport TV (jul 2026).
 */
const KNOWN_FIXTURE_BROADCASTS: Record<number, readonly string[]> = {
  1567311: ["Sport.Tv5"], // Espanha vs Áustria — SoFi Stadium
  1567309: ["Sport.Tv5"], // Portugal vs Croácia — BMO Field
  1567312: ["Sport.Tv5"], // Suíça vs Argélia — BC Place
  1567310: ["Sport.Tv5"], // Colômbia vs Gana — Arrowhead Stadium
};

/** Preenche canais em falta (ou funde com os já sincronizados do OndeBola). */
export function enrichBroadcastChannels(
  fixtureId: number,
  channels: string[]
): string[] {
  const known = KNOWN_FIXTURE_BROADCASTS[fixtureId];
  if (!known?.length) return channels;
  if (!channels.length) return [...known];
  return mergeBroadcastChannels([...known], channels);
}

/** Entradas para persistir na BD durante o sync de broadcasts. */
export function knownBroadcastUpserts(
  seenFixtureIds: ReadonlySet<number>
): { fixture_id: number; channels: string[]; notes: string }[] {
  const rows: { fixture_id: number; channels: string[]; notes: string }[] = [];
  for (const [id, channels] of Object.entries(KNOWN_FIXTURE_BROADCASTS)) {
    const fixtureId = Number(id);
    if (seenFixtureIds.has(fixtureId)) continue;
    rows.push({
      fixture_id: fixtureId,
      channels: [...channels],
      notes: "Curadoria — Sport TV / Sofascore",
    });
  }
  return rows;
}
