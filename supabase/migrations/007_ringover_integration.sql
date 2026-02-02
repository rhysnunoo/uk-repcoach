-- Add ringover_user_id to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ringover_user_id TEXT;

-- Add ringover_call_id to calls
ALTER TABLE calls ADD COLUMN IF NOT EXISTS ringover_call_id TEXT;

-- Create ringover_sync_log table
CREATE TABLE IF NOT EXISTS ringover_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'cron')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  calls_synced INTEGER DEFAULT 0,
  calls_failed INTEGER DEFAULT 0,
  error_message TEXT,
  details JSONB
);

-- Enable RLS
ALTER TABLE ringover_sync_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read sync logs
CREATE POLICY "Allow authenticated read" ON ringover_sync_log
  FOR SELECT TO authenticated USING (true);

-- Allow service role to insert/update
CREATE POLICY "Allow service role write" ON ringover_sync_log
  FOR ALL TO service_role USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calls_ringover_call_id ON calls(ringover_call_id) WHERE ringover_call_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_ringover_user_id ON profiles(ringover_user_id) WHERE ringover_user_id IS NOT NULL;
