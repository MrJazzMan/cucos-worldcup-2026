-- Slots QStash já enfileirados por jogo (dedupe do scheduler diário).
-- Só o service role acede (sync cron); clientes anon/auth não têm políticas.
CREATE TABLE IF NOT EXISTS live_sync_slots (
  fixture_id BIGINT NOT NULL,
  slot_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (fixture_id, slot_at)
);

CREATE INDEX IF NOT EXISTS idx_live_sync_slots_slot_at ON live_sync_slots (slot_at);

ALTER TABLE live_sync_slots ENABLE ROW LEVEL SECURITY;
