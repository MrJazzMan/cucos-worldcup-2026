-- Adiciona role (admin/user) e location ao perfil
-- 2026-06-14

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('admin', 'user')),
  ADD COLUMN IF NOT EXISTS location TEXT;

-- Define o utilizador admin
UPDATE profiles
SET role = 'admin'
WHERE user_id = '4764a298-fab5-401d-bbbb-3da03c86ce08';

-- Admins podem ler todos os perfis (necessário para painel admin)
CREATE POLICY "profiles_admin_select_all" ON profiles
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- Remove a política anterior restrita ao próprio utilizador (agora coberta pela nova)
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
