import { getLiveSyncCallbackUrl, getQStashClient } from "@/lib/qstash";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

/** Minutos antes do apito inicial para começar polling */
export const LIVE_SYNC_PRE_KICKOFF_MIN = 15;
/** Último poll durante a janela "ao vivo" (cobre prolongamentos típicos) */
export const LIVE_SYNC_POLL_END_MIN = 115;
/** Sync final ~10 min após fim esperado do jogo */
export const LIVE_SYNC_POST_KICKOFF_MIN = 125;
export const LIVE_SYNC_INTERVAL_MIN = 5;
/** Agendar jogos com kickoff nas próximas N horas */
export const LIVE_SYNC_HORIZON_HOURS = 48;

export type LiveSyncScheduleResult = {
  fixtures: number;
  slotsQueued: number;
  slotsSkipped: number;
  slotsFailed: number;
};

/** Gera timestamps de sync para um jogo (kickoff−15 … kickoff+115 a cada 5 min + kickoff+125). */
export function buildLiveSyncSlots(
  kickoffUtc: Date,
  now = new Date()
): Date[] {
  const kickoffMs = kickoffUtc.getTime();
  const slots: Date[] = [];

  for (
    let offset = -LIVE_SYNC_PRE_KICKOFF_MIN;
    offset <= LIVE_SYNC_POLL_END_MIN;
    offset += LIVE_SYNC_INTERVAL_MIN
  ) {
    slots.push(new Date(kickoffMs + offset * 60_000));
  }

  slots.push(new Date(kickoffMs + LIVE_SYNC_POST_KICKOFF_MIN * 60_000));

  const minFutureMs = now.getTime() + 30_000;
  return slots.filter((slot) => slot.getTime() > minFutureMs);
}

/**
 * Enfileira slots QStash para jogos upcoming/live com kickoff dentro do horizonte.
 * Idempotente via tabela live_sync_slots.
 */
export async function scheduleLiveSyncJobs(): Promise<LiveSyncScheduleResult> {
  const client = getQStashClient();
  if (!client) {
    return { fixtures: 0, slotsQueued: 0, slotsSkipped: 0, slotsFailed: 0 };
  }

  const admin = createSupabaseAdmin();
  const now = new Date();
  const horizon = new Date(
    now.getTime() + LIVE_SYNC_HORIZON_HOURS * 60 * 60 * 1000
  );
  const lookback = new Date(now.getTime() - 3 * 60 * 60 * 1000);

  const { data: matches, error } = await admin
    .from("matches")
    .select("fixture_id, kickoff_utc, status")
    .gte("kickoff_utc", lookback.toISOString())
    .lte("kickoff_utc", horizon.toISOString())
    .in("status", ["upcoming", "live"]);

  if (error) throw error;
  if (!matches?.length) {
    return { fixtures: 0, slotsQueued: 0, slotsSkipped: 0, slotsFailed: 0 };
  }

  const callbackUrl = getLiveSyncCallbackUrl();
  let slotsQueued = 0;
  let slotsSkipped = 0;
  let slotsFailed = 0;

  for (const match of matches) {
    const kickoff = new Date(match.kickoff_utc);
    const slots = buildLiveSyncSlots(kickoff, now);
    if (!slots.length) continue;

    const { data: existing } = await admin
      .from("live_sync_slots")
      .select("slot_at")
      .eq("fixture_id", match.fixture_id);

    const existingSet = new Set(
      (existing ?? []).map((row) => new Date(row.slot_at).toISOString())
    );

    for (const slot of slots) {
      const slotIso = slot.toISOString();
      if (existingSet.has(slotIso)) {
        slotsSkipped++;
        continue;
      }

      const slotUnix = Math.floor(slot.getTime() / 1000);

      try {
        await client.publishJSON({
          url: callbackUrl,
          body: {
            fixture_id: match.fixture_id,
            slot_at: slotIso,
          },
          notBefore: slotUnix,
          deduplicationId: `wc26-live-${match.fixture_id}-${slotUnix}`,
          retries: 2,
          label: `wc26-live-${match.fixture_id}`,
        });

        const { error: insertError } = await admin
          .from("live_sync_slots")
          .insert({
            fixture_id: match.fixture_id,
            slot_at: slotIso,
          });

        if (insertError) throw insertError;

        slotsQueued++;
        existingSet.add(slotIso);
      } catch (err) {
        slotsFailed++;
        console.warn(
          `live sync schedule failed fixture=${match.fixture_id} slot=${slotIso}:`,
          err
        );
      }
    }
  }

  return {
    fixtures: matches.length,
    slotsQueued,
    slotsSkipped,
    slotsFailed,
  };
}
