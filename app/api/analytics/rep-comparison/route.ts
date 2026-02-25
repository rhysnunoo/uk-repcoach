import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cache, cacheKey, CACHE_TTL } from '@/lib/cache/simple-cache';

export const dynamic = 'force-dynamic';
interface RepStats {
  rep_id: string;
  rep_name: string;
  total_calls: number;
  scored_calls: number;
  avg_score: number;
  conversion_rate: number;
  phase_scores: Record<string, number>;
  trend: number;
  practice_sessions: number;
  last_call_date: string | null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a manager
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'manager' && profile?.role !== 'admin') {
      return NextResponse.json({
        error: 'This feature is available for managers only',
        reps: [],
        teamStats: { avg_score: 0, avg_conversion: 0, total_calls: 0, avg_practice: 0 }
      }, { status: 403 });
    }

    // Check cache
    const cacheKeyStr = cacheKey.analytics('rep-comparison');
    const cachedData = cache.get(cacheKeyStr);
    if (cachedData) {
      return NextResponse.json({ ...(cachedData as Record<string, unknown>), cached: true });
    }

    // Fetch all reps (include all users for comparison, not just role='rep')
    const { data: reps } = await adminClient
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['rep', 'manager', 'admin']);

    if (!reps || reps.length === 0) {
      return NextResponse.json({
        reps: [],
        teamStats: { avg_score: 0, avg_conversion: 0, total_calls: 0, avg_practice: 0 }
      });
    }

    // Fetch all calls for comparison
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recentCalls } = await adminClient
      .from('calls')
      .select('id, rep_id, overall_score, outcome, call_date, status')
      .gte('call_date', thirtyDaysAgo)
      .order('call_date', { ascending: false });

    const { data: previousCalls } = await adminClient
      .from('calls')
      .select('id, rep_id, overall_score, outcome, call_date, status')
      .gte('call_date', sixtyDaysAgo)
      .lt('call_date', thirtyDaysAgo);

    // Fetch scores in batches to avoid unbounded IN clause
    const allCallIds = [...(recentCalls || []), ...(previousCalls || [])].map(c => c.id);
    const BATCH_SIZE = 500;
    let scores: { call_id: string; phase: string; score: number }[] = [];
    for (let i = 0; i < allCallIds.length; i += BATCH_SIZE) {
      const batch = allCallIds.slice(i, i + BATCH_SIZE);
      const { data: batchScores } = await adminClient
        .from('scores')
        .select('call_id, phase, score')
        .in('call_id', batch);
      if (batchScores) scores = scores.concat(batchScores);
    }

    // Fetch practice sessions
    const { data: practiceSessions } = await adminClient
      .from('practice_sessions')
      .select('rep_id, status')
      .gte('created_at', thirtyDaysAgo);

    // Build rep stats
    const repStats: RepStats[] = reps.map(rep => {
      const repRecentCalls = (recentCalls || []).filter(c => c.rep_id === rep.id);
      const repPreviousCalls = (previousCalls || []).filter(c => c.rep_id === rep.id);

      // Calculate current period stats
      const scoredCalls = repRecentCalls.filter(c => c.overall_score !== null);
      const avgScore = scoredCalls.length > 0
        ? scoredCalls.reduce((sum, c) => sum + (c.overall_score || 0), 0) / scoredCalls.length
        : 0;

      // Calculate conversion rate
      const completedCalls = repRecentCalls.filter(c => c.status === 'complete');
      const closedCalls = completedCalls.filter(c =>
        c.outcome === 'annual' || c.outcome === 'monthly' || c.outcome === 'trial'
      );
      const conversionRate = completedCalls.length > 0
        ? (closedCalls.length / completedCalls.length) * 100
        : 0;

      // Calculate trend (compare to previous period)
      const prevScoredCalls = repPreviousCalls.filter(c => c.overall_score !== null);
      const prevAvgScore = prevScoredCalls.length > 0
        ? prevScoredCalls.reduce((sum, c) => sum + (c.overall_score || 0), 0) / prevScoredCalls.length
        : 0;
      const trend = prevAvgScore > 0 ? avgScore - prevAvgScore : 0;

      // Calculate phase scores
      const repScores = (scores || []).filter(s =>
        repRecentCalls.some(c => c.id === s.call_id)
      );
      const phaseScores: Record<string, number> = {};
      const phases = ['opening', 'clarify', 'label', 'overview', 'sell_vacation', 'explain', 'reinforce'];
      phases.forEach(phase => {
        const phaseScoreList = repScores.filter(s => s.phase === phase);
        phaseScores[phase] = phaseScoreList.length > 0
          ? Math.round(phaseScoreList.reduce((sum, s) => sum + s.score, 0) / phaseScoreList.length)
          : 0;
      });

      // Count practice sessions
      const repPractice = (practiceSessions || []).filter(p => p.rep_id === rep.id);

      // Find last call date
      const lastCall = repRecentCalls[0];

      return {
        rep_id: rep.id,
        rep_name: rep.full_name || rep.email,
        total_calls: repRecentCalls.length,
        scored_calls: scoredCalls.length,
        avg_score: Math.round(avgScore),
        conversion_rate: Math.round(conversionRate),
        phase_scores: phaseScores,
        trend: Math.round(trend),
        practice_sessions: repPractice.length,
        last_call_date: lastCall?.call_date || null,
      };
    });

    // Sort by average score descending
    repStats.sort((a, b) => b.avg_score - a.avg_score);

    // Calculate team averages for comparison
    const activeScoreReps = repStats.filter(r => r.avg_score > 0);
    const activeConvReps = repStats.filter(r => r.conversion_rate > 0);
    const teamStats = {
      avg_score: activeScoreReps.length > 0
        ? Math.round(repStats.reduce((sum, r) => sum + r.avg_score, 0) / activeScoreReps.length)
        : 0,
      avg_conversion: activeConvReps.length > 0
        ? Math.round(repStats.reduce((sum, r) => sum + r.conversion_rate, 0) / activeConvReps.length)
        : 0,
      total_calls: repStats.reduce((sum, r) => sum + r.total_calls, 0),
      avg_practice: repStats.length > 0
        ? Math.round(repStats.reduce((sum, r) => sum + r.practice_sessions, 0) / repStats.length)
        : 0,
    };

    const response = {
      reps: repStats,
      teamStats,
    };

    // Cache for 5 minutes
    cache.set(cacheKeyStr, response, CACHE_TTL.MEDIUM);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Rep comparison error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch rep comparison data',
        reps: [],
        teamStats: { avg_score: 0, avg_conversion: 0, total_calls: 0, avg_practice: 0 }
      },
      { status: 500 }
    );
  }
}
