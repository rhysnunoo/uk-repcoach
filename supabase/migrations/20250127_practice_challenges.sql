-- Practice Challenges Migration
-- Creates tables for team practice challenges and leaderboards

-- Create practice_challenges table
CREATE TABLE IF NOT EXISTS practice_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by UUID NOT NULL REFERENCES profiles(id),
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('practice', 'objection_drill')),
  persona TEXT CHECK (persona IN ('skeptical_parent', 'price_sensitive', 'engaged_ready', 'spouse_blocker', 'math_hater')),
  scenario_id TEXT,
  target_score INTEGER NOT NULL DEFAULT 70,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create challenge_participations table
CREATE TABLE IF NOT EXISTS challenge_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES practice_challenges(id) ON DELETE CASCADE,
  rep_id UUID NOT NULL REFERENCES profiles(id),
  practice_session_id UUID REFERENCES practice_sessions(id),
  best_score INTEGER,
  attempts INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, rep_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_practice_challenges_status ON practice_challenges(status);
CREATE INDEX IF NOT EXISTS idx_practice_challenges_dates ON practice_challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_challenge ON challenge_participations(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_rep ON challenge_participations(rep_id);

-- Enable RLS
ALTER TABLE practice_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for practice_challenges
CREATE POLICY "Anyone can read challenges"
  ON practice_challenges FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Managers can create challenges"
  ON practice_challenges FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Managers can update challenges"
  ON practice_challenges FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Managers can delete challenges"
  ON practice_challenges FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

-- RLS Policies for challenge_participations
CREATE POLICY "Anyone can read participations"
  ON challenge_participations FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can create own participations"
  ON challenge_participations FOR INSERT TO authenticated
  WITH CHECK (rep_id = auth.uid());

CREATE POLICY "Users can update own participations"
  ON challenge_participations FOR UPDATE TO authenticated
  USING (rep_id = auth.uid());

-- Allow service role full access
CREATE POLICY "Service role full access to challenges"
  ON practice_challenges FOR ALL TO service_role
  USING (true);

CREATE POLICY "Service role full access to participations"
  ON challenge_participations FOR ALL TO service_role
  USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_practice_challenges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER practice_challenges_updated_at
  BEFORE UPDATE ON practice_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_practice_challenges_updated_at();
