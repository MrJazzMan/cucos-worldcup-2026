-- Última visita ao site (utilizadores com sessão)
-- 2026-06-16

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_last_seen
  ON profiles (last_seen_at DESC NULLS LAST);

COMMENT ON COLUMN profiles.last_seen_at IS
  'Actualizado pelo cliente em cada sessão (ProfileSync). NULL = nunca visitou com sessão activa.';
