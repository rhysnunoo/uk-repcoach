-- Fix function search_path security warnings
-- Sets immutable search_path on all functions to prevent search_path injection attacks

-- Fix update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

-- Fix get_rep_stats function
CREATE OR REPLACE FUNCTION public.get_rep_stats(p_rep_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result json;
BEGIN
  WITH recent_calls AS (
    SELECT * FROM public.calls
    WHERE rep_id = p_rep_id
      AND status = 'complete'
      AND call_date >= now() - interval '30 days'
  ),
  week_calls AS (
    SELECT * FROM recent_calls
    WHERE call_date >= now() - interval '7 days'
  ),
  prev_week_calls AS (
    SELECT * FROM public.calls
    WHERE rep_id = p_rep_id
      AND status = 'complete'
      AND call_date >= now() - interval '14 days'
      AND call_date < now() - interval '7 days'
  ),
  phase_scores AS (
    SELECT
      s.phase,
      avg(s.score) AS avg_score
    FROM public.scores s
    JOIN recent_calls c ON c.id = s.call_id
    GROUP BY s.phase
  ),
  practice_count AS (
    SELECT count(*) AS cnt FROM public.practice_sessions
    WHERE rep_id = p_rep_id
      AND started_at >= now() - interval '7 days'
  )
  SELECT json_build_object(
    'average_score', coalesce((SELECT avg(overall_score) FROM recent_calls), 0),
    'calls_this_week', (SELECT count(*) FROM week_calls),
    'calls_this_month', (SELECT count(*) FROM recent_calls),
    'practice_sessions_this_week', (SELECT cnt FROM practice_count),
    'score_trend', coalesce(
      (SELECT avg(overall_score) FROM week_calls) -
      (SELECT avg(overall_score) FROM prev_week_calls),
      0
    ),
    'scores_by_phase', coalesce(
      (SELECT json_agg(json_build_object(
        'phase', phase,
        'score', round(avg_score::numeric, 1),
        'label', initcap(phase)
      )) FROM phase_scores),
      '[]'::json
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Fix get_manager_stats function
CREATE OR REPLACE FUNCTION public.get_manager_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result json;
BEGIN
  WITH team_calls AS (
    SELECT c.*, p.full_name AS rep_name
    FROM public.calls c
    JOIN public.profiles p ON p.id = c.rep_id
    WHERE c.status = 'complete'
      AND c.call_date >= now() - interval '30 days'
  ),
  week_calls AS (
    SELECT * FROM team_calls
    WHERE call_date >= now() - interval '7 days'
  ),
  rep_scores AS (
    SELECT
      rep_id,
      rep_name,
      avg(overall_score) AS avg_score,
      count(*) AS call_count
    FROM team_calls
    GROUP BY rep_id, rep_name
  ),
  score_dist AS (
    SELECT
      CASE
        WHEN overall_score >= 90 THEN '90-100'
        WHEN overall_score >= 80 THEN '80-89'
        WHEN overall_score >= 70 THEN '70-79'
        WHEN overall_score >= 60 THEN '60-69'
        ELSE 'Below 60'
      END AS range,
      count(*) AS count
    FROM team_calls
    GROUP BY 1
    ORDER BY 1 DESC
  )
  SELECT json_build_object(
    'team_average_score', coalesce((SELECT avg(overall_score) FROM team_calls), 0),
    'total_calls_this_week', (SELECT count(*) FROM week_calls),
    'reps_below_threshold', (SELECT count(*) FROM rep_scores WHERE avg_score < 70),
    'practice_completion_rate', coalesce(
      (SELECT count(*)::float / nullif((SELECT count(DISTINCT rep_id) FROM team_calls), 0) * 100
       FROM public.practice_sessions
       WHERE status = 'completed'
         AND started_at >= now() - interval '7 days'),
      0
    ),
    'score_distribution', coalesce(
      (SELECT json_agg(json_build_object('range', range, 'count', count)) FROM score_dist),
      '[]'::json
    ),
    'team_leaderboard', coalesce(
      (SELECT json_agg(json_build_object(
        'rep_id', rep_id,
        'rep_name', rep_name,
        'average_score', round(avg_score::numeric, 1),
        'calls_count', call_count
      ) ORDER BY avg_score DESC) FROM rep_scores),
      '[]'::json
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Add comments explaining the security measures
COMMENT ON FUNCTION public.update_updated_at() IS 'Trigger function to automatically update updated_at timestamp. Uses empty search_path for security.';
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to create profile when new user signs up. Uses SECURITY DEFINER with empty search_path.';
COMMENT ON FUNCTION public.get_rep_stats(uuid) IS 'Returns aggregated stats for a sales rep. Uses SECURITY DEFINER with empty search_path.';
COMMENT ON FUNCTION public.get_manager_stats() IS 'Returns aggregated team stats for managers. Uses SECURITY DEFINER with empty search_path.';
