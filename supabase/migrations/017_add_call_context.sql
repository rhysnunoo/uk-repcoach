-- Add call_context to calls table
-- Tracks the type of lead/interaction so scoring can adapt accordingly

-- Create the enum type
DO $$ BEGIN
  CREATE TYPE call_context AS ENUM ('new_lead', 'booked_call', 'warm_lead', 'follow_up');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add column with default of 'new_lead' (existing calls assumed first-contact)
ALTER TABLE calls ADD COLUMN IF NOT EXISTS call_context call_context NOT NULL DEFAULT 'new_lead';

-- Index for filtering/analytics by context
CREATE INDEX IF NOT EXISTS idx_calls_call_context ON calls(call_context);
