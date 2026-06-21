-- B3: data de criação do token iCal para expiração/rotação.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS calendar_token_created_at TIMESTAMPTZ;

-- Tokens existentes: considerar criados agora (utilizador pode regenerar no menu)
UPDATE profiles
SET calendar_token_created_at = NOW()
WHERE calendar_token IS NOT NULL
  AND calendar_token_created_at IS NULL;
