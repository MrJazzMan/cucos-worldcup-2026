/** Bump para mostrar o painel outra vez — desaparece para sempre após «Entendi». */
export const WHATS_NEW_VERSION = "2026-06-22";

/** Versão / data mostrada no painel Novidades */
export const WHATS_NEW_RELEASE = "0.5.0";
export const WHATS_NEW_DATE = "2026-06-22";

export const WHATS_NEW_STORAGE_KEY = "wc26-whats-new-seen";

export const WHATS_NEW_ITEM_KEYS = [
  "whatsNew.item.scorers",
  "whatsNew.item.liveScores",
  "whatsNew.item.finishedTime",
  "whatsNew.item.calendar",
  "whatsNew.item.readability",
] as const;

export function hasSeenWhatsNew(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(WHATS_NEW_STORAGE_KEY) === WHATS_NEW_VERSION;
}

export function markWhatsNewSeen(): void {
  localStorage.setItem(WHATS_NEW_STORAGE_KEY, WHATS_NEW_VERSION);
}
