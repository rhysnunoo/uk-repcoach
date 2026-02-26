-- Add Bitrix24 integration support

-- 1. Add 'bitrix' to call_source enum
ALTER TYPE call_source ADD VALUE IF NOT EXISTS 'bitrix';

-- 2. Add bitrix_user_id to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bitrix_user_id text;
CREATE INDEX IF NOT EXISTS idx_profiles_bitrix_user_id ON profiles(bitrix_user_id) WHERE bitrix_user_id IS NOT NULL;

-- 3. Add bitrix_call_id to calls (for deduplication)
ALTER TABLE calls ADD COLUMN IF NOT EXISTS bitrix_call_id text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_calls_bitrix_call_id ON calls(bitrix_call_id) WHERE bitrix_call_id IS NOT NULL;

-- 4. Populate bitrix_user_id for active sales reps and team leads
WITH mapping(email, bitrix_id) AS (VALUES
  ('david.chris@myedspace.co.uk', '60413'),
  ('jahan.salera@talenthero.co', '63569'),
  ('gal.tolentino@talenthero.co', '86981'),
  ('sharon.godfrey@myedspace.co.uk', '86982'),
  ('michelle.manuel@myedspace.co.uk', '91759'),
  ('esiri.aghoghome@myedspace.co.uk', '91762'),
  ('okwuma.samuel@myedspace.co.uk', '137239'),
  ('worthy.abazie@myedspace.co.uk', '137240'),
  ('favour.ekho@myedspace.co.uk', '133364'),
  ('kachi.abazie@myedspace.co.uk', '133372'),
  ('john.attasiem@myedspace.co.uk', '229210'),
  ('inekhomon.okojie@myedspace.co.uk', '229211'),
  ('samuel.nwachinemere@myedspace.co.uk', '229213'),
  ('ada.eze@myedspace.co.uk', '224217'),
  ('celia.john-folarin@myedspace.co.uk', '224219'),
  ('jill.ineh@myedspace.co.uk', '231668'),
  ('immaculate.isa-alex@myedspace.co.uk', '231678'),
  ('praise.folorunso@myedspace.co.uk', '231681'),
  ('grace.idaewor@myedspace.co.uk', '86985'),
  ('richard.showunmi@myedspace.co.uk', '86975')
)
UPDATE profiles p
SET bitrix_user_id = m.bitrix_id, updated_at = now()
FROM mapping m
WHERE LOWER(p.email) = LOWER(m.email);
