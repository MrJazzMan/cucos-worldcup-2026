-- C1 (crítico): impede que clientes anon/authenticated alterem colunas privilegiadas
-- em profiles (especialmente role → escalonamento a admin).
--
-- Abordagem (defesa em profundidade):
--   1. REVOKE UPDATE na tabela + GRANT UPDATE só em colunas legítimas (barreira principal;
--      o REVOKE por coluna isolado NÃO basta quando existe GRANT UPDATE na tabela inteira).
--   2. Trigger BEFORE UPDATE repõe role e calendar_token se alguém contornar os GRANTs.
--   3. REVOKE EXECUTE em funções SECURITY DEFINER expostas via PostgREST.
--
-- Aplicação: manual no Supabase SQL Editor (ver docs de segurança).
-- Idempotente: pode correr mais do que uma vez.

-- ── 1. Privilégios ao nível da coluna ────────────────────────────────────────

REVOKE UPDATE ON public.profiles FROM anon, authenticated;

GRANT UPDATE (
  display_name,
  avatar_url,
  location,
  last_seen_at,
  updated_at
) ON public.profiles TO authenticated;

-- Colunas da migration 004 (ignorar erro se ainda não existirem)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
  ) THEN
    GRANT UPDATE (email, signup_country, preferred_lang) ON public.profiles TO authenticated;
  END IF;
END $$;

-- ── 2. Funções internas: não chamáveis pelo cliente ─────────────────────────

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_site_admin() FROM PUBLIC, anon, authenticated;

-- ── 3. Trigger de segurança (backup) ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      NEW.role := OLD.role;
    END IF;
    IF NEW.calendar_token IS DISTINCT FROM OLD.calendar_token THEN
      NEW.calendar_token := OLD.calendar_token;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_sensitive_columns ON public.profiles;
CREATE TRIGGER profiles_protect_sensitive_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_columns();
