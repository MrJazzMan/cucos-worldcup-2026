/** Liga FIFA World Cup na API-Football */
export const WC_LEAGUE_ID = 1;
export const WC_SEASON = 2026;

/** Ronda pertence ao Mundial 2026? */
export function isWorldCupRound(round: string | null | undefined): boolean {
  if (!round) return false;
  const r = round.toLowerCase();
  return (
    r.includes("group") ||
    r.includes("round of") ||
    r.includes("quarter") ||
    r.includes("semi") ||
    r.includes("final") ||
    r.includes("3rd")
  );
}

/** Jogo na base de dados é do Mundial? */
export function isWorldCupMatch(m: {
  round?: string | null;
  group_name?: string | null;
}): boolean {
  if (m.group_name) return true;
  return isWorldCupRound(m.round);
}
