-- Hora estimada de fim (calculada no sync a partir da API-Football)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS finished_utc TIMESTAMPTZ;
