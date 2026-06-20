/** Estima o instante de fim a partir dos dados da API-Football. */
export function estimateFinishedUtcFromApi(fixture: {
  date: string;
  status: { short: string; elapsed: number | null };
  periods?: { first: number | null; second: number | null } | null;
}): string | null {
  const FINISHED = new Set(["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC"]);
  if (!FINISHED.has(fixture.status.short)) return null;

  const elapsed = fixture.status.elapsed;
  const kickoffMs = new Date(fixture.date).getTime();
  const secondStart = fixture.periods?.second;

  // 2.ª parte + minutos decorridos (inclui prolongamentos no elapsed).
  if (secondStart && elapsed != null && elapsed > 45) {
    return new Date(secondStart * 1000 + (elapsed - 45) * 60_000).toISOString();
  }

  // Fallback: kickoff + tempo de jogo + intervalo (~15 min).
  if (elapsed != null) {
    return new Date(kickoffMs + (elapsed + 15) * 60_000).toISOString();
  }

  return new Date(kickoffMs + 105 * 60_000).toISOString();
}

/** Fallback para linhas antigas sem finished_utc na BD. */
export function fallbackFinishedUtc(
  kickoffUtc: string,
  minute: number | null
): string {
  const kickoffMs = new Date(kickoffUtc).getTime();
  const playMinutes = minute ?? 90;
  return new Date(kickoffMs + (playMinutes + 15) * 60_000).toISOString();
}

export function resolveFinishedUtc(match: {
  kickoff_utc: string;
  finished_utc?: string | null;
  minute: number | null;
  status: string;
}): string | null {
  if (match.status !== "finished") return null;
  return match.finished_utc ?? fallbackFinishedUtc(match.kickoff_utc, match.minute);
}
