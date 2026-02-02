-- Add ringover_user_id to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ringover_user_id TEXT;

-- Add ringover_call_id to calls if not exists
ALTER TABLE calls ADD COLUMN IF NOT EXISTS ringover_call_id TEXT;

-- Add audio_url to calls for local storage (already exists as recording_url, but adding for clarity)
-- The recording_url field is used for external URLs (HubSpot, Ringover)
-- The storage_path field is used for Supabase storage paths

-- Create ringover_sync_log table if not exists
CREATE TABLE IF NOT EXISTS ringover_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'cron', 'webhook')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  calls_synced INTEGER DEFAULT 0,
  calls_failed INTEGER DEFAULT 0,
  error_message TEXT,
  details JSONB
);

-- Enable RLS on ringover_sync_log
ALTER TABLE ringover_sync_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read sync logs
DROP POLICY IF EXISTS "Allow authenticated read ringover sync" ON ringover_sync_log;
CREATE POLICY "Allow authenticated read ringover sync" ON ringover_sync_log
  FOR SELECT TO authenticated USING (true);

-- Allow service role to insert/update sync logs
DROP POLICY IF EXISTS "Allow service role write ringover sync" ON ringover_sync_log;
CREATE POLICY "Allow service role write ringover sync" ON ringover_sync_log
  FOR ALL TO service_role USING (true);

-- Create index on ringover_call_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_calls_ringover_call_id ON calls(ringover_call_id);

-- Create index on ringover_user_id for faster user mapping lookups
CREATE INDEX IF NOT EXISTS idx_profiles_ringover_user_id ON profiles(ringover_user_id);

-- Update source constraint to allow 'ringover' (should already be there, but ensuring)
-- Note: If you have a CHECK constraint on source, update it:
-- ALTER TABLE calls DROP CONSTRAINT IF EXISTS calls_source_check;
-- ALTER TABLE calls ADD CONSTRAINT calls_source_check CHECK (source IN ('hubspot', 'ringover', 'manual'));
