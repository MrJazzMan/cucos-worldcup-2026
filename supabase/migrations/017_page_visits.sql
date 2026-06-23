-- Analytics internos: visitas por página (wc26.pt)
CREATE TABLE page_visits (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NULL REFERENCES profiles (user_id),
  page TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_page_visits_created_at ON page_visits (created_at);
CREATE INDEX idx_page_visits_user_id ON page_visits (user_id);
CREATE INDEX idx_page_visits_page ON page_visits (page);

ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante pode registar uma visita (anónimo ou autenticado)
CREATE POLICY "page_visits_insert" ON page_visits
  FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Leitura reservada a admins (queries SQL / service role para relatórios)
CREATE POLICY "page_visits_admin_select" ON page_visits
  FOR SELECT
  USING (public.is_site_admin());
