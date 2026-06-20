-- Token secreto por utilizador para subscrição iCal (equipas favoritas)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS calendar_token TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_calendar_token
  ON profiles (calendar_token)
  WHERE calendar_token IS NOT NULL;
