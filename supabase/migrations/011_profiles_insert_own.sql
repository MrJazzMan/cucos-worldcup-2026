-- Utilizadores podem criar o próprio perfil se o trigger auth falhou ou conta antiga
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
