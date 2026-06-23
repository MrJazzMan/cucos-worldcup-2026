-- Identificador de sessão do browser (sessionStorage) para métricas futuras
ALTER TABLE page_visits
  ADD COLUMN session_id TEXT;

CREATE INDEX idx_page_visits_session_id ON page_visits (session_id);
