-- Normalização de equipas (PLANO — não aplicar sem actualizar o código da app)
-- 2026-06-16
--
-- Fase A: tabela canónica + backfill
-- Fase B: FK em favourite_teams, remover team_name
-- Fase C (opcional): matches só com team_id + JOIN em leitura
--
-- Ver discussão em CHANGELOG / docs quando implementado.

-- ---------------------------------------------------------------------------
-- Fase A — tabela teams (id = API-Football team id)
-- ---------------------------------------------------------------------------
/*
CREATE TABLE teams (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO teams (id, name, logo)
SELECT DISTINCT ON (id) id, name, logo
FROM (
  SELECT home_team_id AS id, home_team_name AS name, home_team_logo AS logo FROM matches
  UNION ALL
  SELECT away_team_id, away_team_name, away_team_logo FROM matches
  UNION ALL
  SELECT team_id, team_name, NULL FROM favourite_teams
) AS src
ORDER BY id, name
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  logo = COALESCE(EXCLUDED.logo, teams.logo),
  updated_at = NOW();

ALTER TABLE favourite_teams
  ADD CONSTRAINT favourite_teams_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES teams (id);

ALTER TABLE matches
  ADD CONSTRAINT matches_home_team_id_fkey
  FOREIGN KEY (home_team_id) REFERENCES teams (id),
  ADD CONSTRAINT matches_away_team_id_fkey
  FOREIGN KEY (away_team_id) REFERENCES teams (id);

-- Fase B — depois de actualizar SettingsFavourites e queries
ALTER TABLE favourite_teams DROP COLUMN team_name;

-- Fase C — denormalização em matches (opcional, maior refactor)
-- ALTER TABLE matches DROP COLUMN home_team_name, home_team_logo, away_team_name, away_team_logo;
*/

-- ---------------------------------------------------------------------------
-- Fase D (futuro) — seguir competições/grupos, não só equipas
-- ---------------------------------------------------------------------------
/*
CREATE TYPE follow_target AS ENUM ('team', 'group', 'competition');

CREATE TABLE user_follows (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  target_type follow_target NOT NULL,
  target_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)
);

-- Migrar favourite_teams → user_follows (target_type = 'team', target_id = team_id::text)
-- Depois DROP favourite_teams
*/
