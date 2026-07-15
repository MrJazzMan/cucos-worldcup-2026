import { Redis } from "@upstash/redis";
import { isSyntheticFixture } from "@/lib/feeder-teams";
import type { Match } from "@/types";

/** Minutos após o kickoff para considerar um upcoming/live "atrasado". */
export const STALE_SCORE_GRACE_MIN = 20;
/** Intervalo mínimo entre syncs de recuperação (protege a API-Football). */
export const STALE_SCORE_SYNC_COOLDOWN_SEC = 90;

const MEMORY_LOCK_KEY = "stale-live-sync";
const memoryLocks = new Map<string, number>();

export function matchNeedsScoreRefresh(
  match: Pick<Match, "fixture_id" | "status" | "kickoff_utc">,
  now = new Date()
): boolean {
  if (isSyntheticFixture(match.fixture_id)) return false;
  if (match.status !== "upcoming" && match.status !== "live") return false;
  const kickoffMs = new Date(match.kickoff_utc).getTime();
  if (!Number.isFinite(kickoffMs)) return false;
  return kickoffMs < now.getTime() - STALE_SCORE_GRACE_MIN * 60_000;
}

export function matchesNeedScoreRefresh(
  matches: Pick<Match, "fixture_id" | "status" | "kickoff_utc">[],
  now = new Date()
): boolean {
  return matches.some((match) => matchNeedsScoreRefresh(match, now));
}

async function tryAcquireSyncLock(
  cooldownSec = STALE_SCORE_SYNC_COOLDOWN_SEC
): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (url && token) {
    try {
      const redis = new Redis({ url, token });
      const result = await redis.set("wc26:stale-live-sync", "1", {
        nx: true,
        ex: cooldownSec,
      });
      return result === "OK";
    } catch (err) {
      console.warn("stale score refresh redis lock failed:", err);
      // Fall through to memory lock.
    }
  }

  const now = Date.now();
  const until = memoryLocks.get(MEMORY_LOCK_KEY) ?? 0;
  if (until > now) return false;
  memoryLocks.set(MEMORY_LOCK_KEY, now + cooldownSec * 1000);
  return true;
}

/**
 * Se houver jogos upcoming/live já começados sem resultado na BD,
 * dispara um sync live (com cooldown global). Usado nas páginas — o
 * visitante desencadeia a recuperação do FT.
 */
export async function maybeSyncStaleMatchScores(
  matches: Pick<Match, "fixture_id" | "status" | "kickoff_utc">[]
): Promise<{ attempted: boolean; synced?: number; reason?: string }> {
  if (!matchesNeedScoreRefresh(matches)) {
    return { attempted: false, reason: "no-stale" };
  }

  if (!process.env.API_FOOTBALL_KEY) {
    return { attempted: false, reason: "no-api-key" };
  }

  const acquired = await tryAcquireSyncLock();
  if (!acquired) {
    return { attempted: false, reason: "cooldown" };
  }

  try {
    const { syncMatches } = await import("@/lib/sync");
    const result = await syncMatches("live");
    return {
      attempted: true,
      synced: result.synced,
      reason: result.source,
    };
  } catch (err) {
    console.warn("stale score refresh failed:", err);
    return { attempted: true, reason: "error" };
  }
}
