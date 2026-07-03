-- Resultado do desempate por grandes penalidades (fase a eliminar).
-- Preenchido no sync a partir de fixture.score.penalty da API-Football.
ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_pen INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_pen INTEGER;
