/**
 * Recintos oficiais FIFA (M73–M104) quando a API-Football ainda não envia venue.
 * Fonte: calendário FIFA WC26 — https://www.fifa.com/.../match-schedule-fixtures-results-teams-stadiums
 */
const OFFICIAL_FIXTURE_VENUES: Record<number, string> = {
  // Dezasseis-avos sem venue na API (2026-06-28)
  1564789: "Dallas · AT&T Stadium", // M78 — Costa do Marfim vs Noruega
  1562586: "Santa Clara · Levi's Stadium", // M81 — EUA vs Bósnia
  1565178: "Dallas · AT&T Stadium", // M88 — Austrália vs Egito
};

/** Resolve recinto: API primeiro; fallback ao calendário oficial FIFA. */
export function resolveMatchVenue(
  fixtureId: number,
  apiVenue: string | null | undefined
): string | null {
  const trimmed = apiVenue?.trim();
  if (trimmed) return trimmed;
  return OFFICIAL_FIXTURE_VENUES[fixtureId] ?? null;
}

/** Aplica fallback de recinto ao ler da BD (API pode ainda não ter sincronizado). */
export function enrichMatchVenue<T extends { fixture_id: number; venue: string | null }>(
  match: T
): T {
  const venue = resolveMatchVenue(match.fixture_id, match.venue);
  return venue === match.venue ? match : { ...match, venue };
}
