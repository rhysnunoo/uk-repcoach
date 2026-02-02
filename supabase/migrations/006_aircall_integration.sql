-- Migration: Add Aircall integration support
-- Description: Adds fields and tables needed for Aircall call syncing

-- Add aircall_user_id to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS aircall_user_id TEXT;

-- Add aircall_call_id to calls table
ALTER TABLE calls ADD COLUMN IF NOT EXISTS aircall_call_id TEXT;

-- Create unique index on aircall_call_id for duplicate checking
CREATE UNIQUE INDEX IF NOT EXISTS calls_aircall_call_id_unique
ON calls (aircall_call_id)
WHERE aircall_call_id IS NOT NULL;

-- Create aircall_sync_log table
CREATE TABLE IF NOT EXISTS aircall_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'cron')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  calls_synced INTEGER DEFAULT 0,
  calls_failed INTEGER DEFAULT 0,
  error_message TEXT,
  details JSONB
);

-- Enable RLS on aircall_sync_log
ALTER TABLE aircall_sync_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read sync logs
CREATE POLICY "Allow authenticated read" ON aircall_sync_log
  FOR SELECT TO authenticated USING (true);

-- Allow service role to insert/update (used by sync jobs)
CREATE POLICY "Allow service role write" ON aircall_sync_log
  FOR ALL TO service_role USING (true);

-- Create index for faster sync history queries
CREATE INDEX IF NOT EXISTS aircall_sync_log_started_at_idx
ON aircall_sync_log (started_at DESC);

-- Add comment for documentation
COMMENT ON TABLE aircall_sync_log IS 'Tracks Aircall sync job history';
COMMENT ON COLUMN profiles.aircall_user_id IS 'Aircall user ID for call attribution';
COMMENT ON COLUMN calls.aircall_call_id IS 'Aircall call ID for deduplication';
