-- Optimize RLS Policies for Performance
-- 1. Use (select auth.uid()) instead of auth.uid() to prevent per-row evaluation
-- 2. Consolidate multiple permissive policies into single policies

-- ============================================
-- PROFILES TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

-- Create optimized consolidated policies
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role IN ('manager', 'admin')
    )
  );

CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (
    id = (select auth.uid())
  );

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (
    id = (select auth.uid())
  );

-- ============================================
-- SCRIPTS TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active scripts" ON public.scripts;
DROP POLICY IF EXISTS "Admins can manage scripts" ON public.scripts;

-- Create optimized consolidated policies
CREATE POLICY "scripts_select_policy" ON public.scripts
  FOR SELECT USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "scripts_insert_policy" ON public.scripts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "scripts_update_policy" ON public.scripts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "scripts_delete_policy" ON public.scripts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================
-- CALLS TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Reps can view own calls" ON public.calls;
DROP POLICY IF EXISTS "Reps can insert own calls" ON public.calls;
DROP POLICY IF EXISTS "Reps can update own calls" ON public.calls;
DROP POLICY IF EXISTS "Managers can view all calls" ON public.calls;
DROP POLICY IF EXISTS "Managers can update all calls" ON public.calls;

-- Create optimized consolidated policies
CREATE POLICY "calls_select_policy" ON public.calls
  FOR SELECT USING (
    rep_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "calls_insert_policy" ON public.calls
  FOR INSERT WITH CHECK (
    rep_id = (select auth.uid())
  );

CREATE POLICY "calls_update_policy" ON public.calls
  FOR UPDATE USING (
    rep_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role IN ('manager', 'admin')
    )
  );

-- ============================================
-- SCORES TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view scores for their calls" ON public.scores;
DROP POLICY IF EXISTS "Managers can view all scores" ON public.scores;

-- Create optimized consolidated policy
CREATE POLICY "scores_select_policy" ON public.scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.calls
      WHERE calls.id = scores.call_id AND calls.rep_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role IN ('manager', 'admin')
    )
  );

-- ============================================
-- PRACTICE_SESSIONS TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Reps can view own practice sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Reps can insert own practice sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Reps can update own practice sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Managers can view all practice sessions" ON public.practice_sessions;

-- Create optimized consolidated policies
CREATE POLICY "practice_sessions_select_policy" ON public.practice_sessions
  FOR SELECT USING (
    rep_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "practice_sessions_insert_policy" ON public.practice_sessions
  FOR INSERT WITH CHECK (
    rep_id = (select auth.uid())
  );

CREATE POLICY "practice_sessions_update_policy" ON public.practice_sessions
  FOR UPDATE USING (
    rep_id = (select auth.uid())
  );

-- ============================================
-- CALL_NOTES TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view notes on their calls" ON public.call_notes;
DROP POLICY IF EXISTS "Managers can view all notes" ON public.call_notes;
DROP POLICY IF EXISTS "Users can create notes" ON public.call_notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.call_notes;

-- Create optimized consolidated policies
CREATE POLICY "call_notes_select_policy" ON public.call_notes
  FOR SELECT USING (
    author_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.calls
      WHERE calls.id = call_notes.call_id AND calls.rep_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "call_notes_insert_policy" ON public.call_notes
  FOR INSERT WITH CHECK (
    author_id = (select auth.uid())
  );

CREATE POLICY "call_notes_update_policy" ON public.call_notes
  FOR UPDATE USING (
    author_id = (select auth.uid())
  );

-- ============================================
-- HUBSPOT_SYNC_LOG TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Managers can view sync logs" ON public.hubspot_sync_log;

-- Create optimized policy
CREATE POLICY "hubspot_sync_log_select_policy" ON public.hubspot_sync_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role IN ('manager', 'admin')
    )
  );

-- Add comments
COMMENT ON POLICY "profiles_select_policy" ON public.profiles IS 'Users can view own profile, managers/admins can view all';
COMMENT ON POLICY "calls_select_policy" ON public.calls IS 'Users can view own calls, managers/admins can view all';
COMMENT ON POLICY "scores_select_policy" ON public.scores IS 'Users can view scores for their calls, managers/admins can view all';
COMMENT ON POLICY "practice_sessions_select_policy" ON public.practice_sessions IS 'Users can view own sessions, managers/admins can view all';
COMMENT ON POLICY "call_notes_select_policy" ON public.call_notes IS 'Users can view notes they authored or on their calls, managers/admins can view all';
