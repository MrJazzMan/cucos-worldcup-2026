-- Bloqueia UPDATE de role/calendar_token pelo cliente (anon/authenticated).
-- REVOKE por coluna isolado não basta quando há GRANT UPDATE na tabela inteira.

REVOKE UPDATE ON public.profiles FROM anon, authenticated;

GRANT UPDATE (
  display_name,
  avatar_url,
  location,
  last_seen_at,
  updated_at
) ON public.profiles TO authenticated;

-- Quando migration 004 existir, acrescentar: email, signup_country, preferred_lang

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_site_admin() FROM PUBLIC, anon, authenticated;

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
