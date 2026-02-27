-- Migration: Add price_presentation to scores phase constraint
-- The scoring code includes a price_presentation phase but the DB constraint was missing it

-- Drop the existing constraint
ALTER TABLE scores DROP CONSTRAINT IF EXISTS scores_phase_check;

-- Re-add with price_presentation included
ALTER TABLE scores ADD CONSTRAINT scores_phase_check
  CHECK (phase IN ('opening', 'clarify', 'label', 'overview', 'sell_vacation', 'price_presentation', 'explain', 'reinforce'));
