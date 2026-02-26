-- Standalone calls + scores tables (no auth.users dependency)
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Calls table (uses bitrix_user_id instead of auth-linked rep_id)
CREATE TABLE IF NOT EXISTS calls (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  bitrix_user_id text REFERENCES bitrix_user_mapping(bitrix_user_id),
  source text DEFAULT 'bitrix' NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  bitrix_call_id text UNIQUE,
  recording_url text,
  storage_path text,
  transcript jsonb,
  duration_seconds integer,
  call_date timestamptz NOT NULL,
  contact_name text,
  contact_phone text,
  outcome text,
  overall_score numeric(5,2),
  summary text,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  call_id uuid REFERENCES calls(id) ON DELETE CASCADE NOT NULL,
  phase text NOT NULL,
  score numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  feedback text NOT NULL,
  highlights text[] DEFAULT array[]::text[],
  improvements text[] DEFAULT array[]::text[],
  quotes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(call_id, phase)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calls_bitrix_user_id ON calls(bitrix_user_id);
CREATE INDEX IF NOT EXISTS idx_calls_call_date ON calls(call_date DESC);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_bitrix_call_id ON calls(bitrix_call_id);
CREATE INDEX IF NOT EXISTS idx_scores_call_id ON scores(call_id);

-- Auto-update updated_at on calls
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
