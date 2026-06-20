-- Evita recursão RLS ao verificar role admin na mesma tabela profiles
CREATE OR REPLACE FUNCTION public.is_site_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

DROP POLICY IF EXISTS "profiles_admin_select_all" ON profiles;

CREATE POLICY "profiles_admin_select_all" ON profiles
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_site_admin());
