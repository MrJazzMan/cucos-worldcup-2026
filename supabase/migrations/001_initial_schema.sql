-- Cucos World Cup 2026 — schema inicial
-- Última actualização: 2026-06-13

-- Enum de status de jogo
CREATE TYPE match_status AS ENUM ('upcoming', 'live', 'finished');

-- Jogos sincronizados da API-Football
CREATE TABLE matches (
  fixture_id INTEGER PRIMARY KEY,
  kickoff_utc TIMESTAMPTZ NOT NULL,
  match_date DATE NOT NULL,
  home_team_id INTEGER NOT NULL,
  home_team_name TEXT NOT NULL,
  home_team_logo TEXT,
  away_team_id INTEGER NOT NULL,
  away_team_name TEXT NOT NULL,
  away_team_logo TEXT,
  home_score INTEGER,
  away_score INTEGER,
  status match_status NOT NULL DEFAULT 'upcoming',
  minute INTEGER,
  round TEXT,
  group_name TEXT,
  venue TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_date ON matches (match_date);
CREATE INDEX idx_matches_status ON matches (status);
CREATE INDEX idx_matches_kickoff ON matches (kickoff_utc);

-- Canais TV portugueses (curadoria manual)
CREATE TABLE broadcasts (
  fixture_id INTEGER PRIMARY KEY REFERENCES matches (fixture_id) ON DELETE CASCADE,
  channels TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Perfis de utilizador
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Equipas favoritas
CREATE TABLE favourite_teams (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, team_id)
);

CREATE INDEX idx_favourite_teams_user ON favourite_teams (user_id);

-- Preferências de notificação
CREATE TABLE notification_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  before_24h BOOLEAN NOT NULL DEFAULT TRUE,
  before_1h BOOLEAN NOT NULL DEFAULT TRUE,
  before_15m BOOLEAN NOT NULL DEFAULT TRUE,
  match_started BOOLEAN NOT NULL DEFAULT TRUE,
  final_result BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions Web Push
CREATE TABLE push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

-- Log de notificações enviadas (anti-duplicado)
CREATE TABLE notification_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  fixture_id INTEGER NOT NULL REFERENCES matches (fixture_id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, fixture_id, notification_type)
);

-- Trigger: criar perfil e prefs ao registar
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO notification_prefs (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favourite_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Público: leitura de jogos e broadcasts
CREATE POLICY "matches_public_read" ON matches FOR SELECT USING (TRUE);
CREATE POLICY "broadcasts_public_read" ON broadcasts FOR SELECT USING (TRUE);

-- Perfis: próprio utilizador
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Favoritos: próprio utilizador
CREATE POLICY "favourites_select_own" ON favourite_teams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favourites_insert_own" ON favourite_teams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favourites_delete_own" ON favourite_teams FOR DELETE USING (auth.uid() = user_id);

-- Notificações: próprio utilizador
CREATE POLICY "notif_prefs_select_own" ON notification_prefs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_prefs_update_own" ON notification_prefs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "push_subs_select_own" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "push_subs_insert_own" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_subs_delete_own" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "notif_log_select_own" ON notification_log FOR SELECT USING (auth.uid() = user_id);

-- Service role bypassa RLS para sync e push cron

-- Dados iniciais de broadcasts (jogos Portugal — exemplo PRD)
-- Nota: fixture_ids serão actualizados após primeiro sync; estes são placeholders
-- INSERT será feito via seed após sync ou admin
