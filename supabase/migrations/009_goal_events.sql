-- Marcadores (golos, penáltis, autogolos) sincronizados da API-Football
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS goal_events JSONB NOT NULL DEFAULT '[]'::jsonb;
