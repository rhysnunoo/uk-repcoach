-- Allow webhook to create calls without a logged-in user profile
-- Run this in Supabase SQL Editor

-- Make rep_id nullable so calls can be created via webhook (bitrix_user_id only)
-- When reps sign up later, backfill rep_id with:
--   UPDATE calls SET rep_id = p.id FROM profiles p
--   WHERE calls.bitrix_user_id = p.bitrix_user_id AND calls.rep_id IS NULL;
ALTER TABLE calls ALTER COLUMN rep_id DROP NOT NULL;

-- Add bitrix_user_id to profiles for future linking (when reps sign up)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bitrix_user_id text;
