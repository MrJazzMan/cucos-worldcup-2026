import { getLiveSyncCallbackUrl, getQStashClient } from "@/lib/qstash";
import { isSyntheticFixture } from "@/lib/feeder-teams";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

/** Minutos antes do apito inicial para começar polling */
export const LIVE_SYNC_PRE_KICKOFF_MIN = 15;
/** Último poll durante a janela "ao vivo" (cobre prolongamentos típicos) */
export const LIVE_SYNC_POLL_END_MIN = 115;
/** Sync final ~10 min após fim esperado do jogo */
export const LIVE_SYNC_POST_KICKOFF_MIN = 125;
/**
 * Catch-ups após a janela principal — cobre prolongamentos longos, penáltis
 * e QStash/cron falhados no meio do jogo (plano Hobby sem cron horário).
 */
export const LIVE_SYNC_CATCHUP_OFFSETS_MIN = [
  150, 180, 210, 240, 300, 360, 420,
] as const;
export const LIVE_SYNC_INTERVAL_MIN = 5;
/** Agendar jogos com kickoff nas próximas N horas */
export const LIVE_SYNC_HORIZON_HOURS = 48;
/** Incluir upcoming/live com kickoff até N horas no passado */
export const LIVE_SYNC_LOOKBACK_HOURS = 12;

export type LiveSyncScheduleResult = {
  fixtures: number;
  slotsQueued: number;
  slotsSkipped: number;
  slotsFailed: number;
};

/** Gera timestamps de sync para um jogo (pré-jogo → catch-up pós-jogo). */
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
  for (const offset of LIVE_SYNC_CATCHUP_OFFSETS_MIN) {
    slots.push(new Date(kickoffMs + offset * 60_000));
  }

  const minFutureMs = now.getTime() + 30_000;
  const future = slots.filter((slot) => slot.getTime() > minFutureMs);

  // Se o jogo já começou (ou acabou) e todos os slots "normais" expiraram,
  // agenda um catch-up imediato para não ficar preso em upcoming até ao
  // sync diário das 06:00.
  const overdue =
    kickoffMs < now.getTime() - LIVE_SYNC_PRE_KICKOFF_MIN * 60_000;
  if (overdue && future.length === 0) {
    future.push(new Date(now.getTime() + 45_000));
  }

  return future;
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
  const lookback = new Date(
    now.getTime() - LIVE_SYNC_LOOKBACK_HOURS * 60 * 60 * 1000
  );

  const { data: matches, error } = await admin
    .from("matches")
    .select("fixture_id, kickoff_utc, status")
    .gte("kickoff_utc", lookback.toISOString())
    .lte("kickoff_utc", horizon.toISOString())
    .in("status", ["upcoming", "live"]);

  if (error) throw error;

  const realMatches = (matches ?? []).filter(
    (m) => !isSyntheticFixture(m.fixture_id)
  );
  if (!realMatches.length) {
    return { fixtures: 0, slotsQueued: 0, slotsSkipped: 0, slotsFailed: 0 };
  }

  const callbackUrl = getLiveSyncCallbackUrl();
  let slotsQueued = 0;
  let slotsSkipped = 0;
  let slotsFailed = 0;

  for (const match of realMatches) {
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
    fixtures: realMatches.length,
    slotsQueued,
    slotsSkipped,
    slotsFailed,
  };
}
