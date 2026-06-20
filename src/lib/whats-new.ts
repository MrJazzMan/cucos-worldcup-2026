/** Bump when adding user-facing items — re-shows the banner once per browser. */
export const WHATS_NEW_VERSION = "2026-06-21";

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
