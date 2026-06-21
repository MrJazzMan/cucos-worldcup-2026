-- Renomeia o canal "LV" para "LiveModeTv" nos broadcasts já gravados.
-- "LV" era uma sigla manual; o nome correto (igual ao do OndeBola) é "LiveModeTv".
-- A coluna broadcasts.channels é TEXT[].

UPDATE broadcasts
SET
  channels = array_replace(channels, 'LV', 'LiveModeTv'),
  updated_at = NOW()
WHERE 'LV' = ANY (channels);
