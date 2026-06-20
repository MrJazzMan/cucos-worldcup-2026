-- Classificações de grupo sincronizadas da API-Football (actualizadas no sync live/full)

CREATE TABLE group_standings (
  group_name TEXT PRIMARY KEY,
  rows JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE group_standings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_standings_public_read" ON group_standings
  FOR SELECT USING (TRUE);
