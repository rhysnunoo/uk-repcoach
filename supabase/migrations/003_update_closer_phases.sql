-- Migration: Update CLOSER framework phases to Hormozi methodology
-- Run this in Supabase SQL Editor

-- First, delete any existing scores (they use old phases)
DELETE FROM scores;

-- Drop the existing constraint
ALTER TABLE scores DROP CONSTRAINT IF EXISTS scores_phase_check;

-- Add new constraint with Hormozi CLOSER phases
ALTER TABLE scores ADD CONSTRAINT scores_phase_check
  CHECK (phase IN ('opening', 'clarify', 'label', 'overview', 'sell_vacation', 'explain', 'reinforce'));

-- Update the unique constraint to allow new phases
-- (The unique constraint on call_id, phase should still work)

-- Verify the constraint is updated
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'scores'::regclass AND contype = 'c';
