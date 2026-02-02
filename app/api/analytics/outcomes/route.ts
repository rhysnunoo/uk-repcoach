import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cache, cacheKey, CACHE_TTL } from '@/lib/cache/simple-cache';

interface CallWithScores {
  id: string;
  rep_id: string;
  outcome: string | null;
  overall_score: number | null;
  call_date: string;
  profiles?: { full_name: string | null; email: string } | null;
}

interface ScoreRecord {
  call_id: string;
  phase: string;
  score: number;
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is manager/admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null };

    const isManager = profile?.role === 'manager' || profile?.role === 'admin';

    // Check cache (different keys for manager vs rep view)
    const cacheKeyStr = isManager
      ? cacheKey.analytics('outcomes:manager')
      : cacheKey.analytics(`outcomes:rep:${user.id}`);

    const cachedData = cache.get(cacheKeyStr);
    if (cachedData) {
      return NextResponse.json({ ...(cachedData as Record<string, unknown>), cached: true });
    }

    const adminClient = createAdminClient();

    // Fetch completed calls with outcomes
    let callsQuery = adminClient
      .from('calls')
      .select('id, rep_id, outcome, overall_score, call_date')
      .eq('status', 'complete')
      .not('overall_score', 'is', null);

    if (!isManager) {
      callsQuery = callsQuery.eq('rep_id', user.id);
    }

    const { data: calls, error: callsError } = await callsQuery;

    if (callsError) {
      console.error('Failed to fetch calls:', callsError);
      return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
    }

    const typedCalls = calls as CallWithScores[];

    // Fetch all scores for these calls
    const callIds = typedCalls.map(c => c.id);
    const { data: scores } = await adminClient
      .from('scores')
      .select('call_id, phase, score')
      .in('call_id', callIds);

    const typedScores = (scores || []) as ScoreRecord[];

    // Fetch rep names if manager
    let repNames: Record<string, string> = {};
    if (isManager) {
      const repIds = [...new Set(typedCalls.map(c => c.rep_id))];
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('id, full_name, email')
        .in('id', repIds);

      if (profiles) {
        profiles.forEach((p: { id: string; full_name: string | null; email: string }) => {
          repNames[p.id] = p.full_name || p.email;
        });
      }
    }

    // Calculate analytics
    const analytics = calculateOutcomeAnalytics(typedCalls, typedScores, repNames);

    // Cache the result
    cache.set(cacheKeyStr, analytics, CACHE_TTL.LONG);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateOutcomeAnalytics(
  calls: CallWithScores[],
  scores: ScoreRecord[],
  repNames: Record<string, string>
) {
  // Group scores by call
  const scoresByCall: Record<string, Record<string, number>> = {};
  scores.forEach(s => {
    if (!scoresByCall[s.call_id]) scoresByCall[s.call_id] = {};
    scoresByCall[s.call_id][s.phase] = s.score;
  });

  // Define closed outcomes
  const closedOutcomes = ['annual', 'monthly', 'trial'];

  // Overall conversion rate
  const completedCalls = calls.filter(c => c.outcome !== null);
  const closedCalls = completedCalls.filter(c => closedOutcomes.includes(c.outcome!));
  const overallConversionRate = completedCalls.length > 0
    ? (closedCalls.length / completedCalls.length) * 100
    : 0;

  // Conversion by outcome type
  const outcomeBreakdown: Record<string, number> = {};
  completedCalls.forEach(c => {
    outcomeBreakdown[c.outcome!] = (outcomeBreakdown[c.outcome!] || 0) + 1;
  });

  // Conversion by score range
  const scoreRanges = [
    { label: '80-100%', min: 80, max: 100 },
    { label: '60-79%', min: 60, max: 79 },
    { label: '40-59%', min: 40, max: 59 },
    { label: '0-39%', min: 0, max: 39 },
  ];

  const conversionByScore = scoreRanges.map(range => {
    const callsInRange = completedCalls.filter(c =>
      c.overall_score !== null &&
      c.overall_score >= range.min &&
      c.overall_score <= range.max
    );
    const closedInRange = callsInRange.filter(c => closedOutcomes.includes(c.outcome!));
    return {
      range: range.label,
      totalCalls: callsInRange.length,
      closedCalls: closedInRange.length,
      conversionRate: callsInRange.length > 0
        ? (closedInRange.length / callsInRange.length) * 100
        : 0,
    };
  });

  // Phase correlation with closes
  const phases = ['opening', 'clarify', 'label', 'overview', 'sell_vacation', 'explain', 'reinforce'];
  const phaseCorrelation = phases.map(phase => {
    const callsWithPhase = completedCalls.filter(c => scoresByCall[c.id]?.[phase] !== undefined);
    const closedWithPhase = callsWithPhase.filter(c => closedOutcomes.includes(c.outcome!));
    const notClosedWithPhase = callsWithPhase.filter(c => !closedOutcomes.includes(c.outcome!));

    const avgScoreClosed = closedWithPhase.length > 0
      ? closedWithPhase.reduce((sum, c) => sum + (scoresByCall[c.id]?.[phase] || 0), 0) / closedWithPhase.length
      : 0;
    const avgScoreNotClosed = notClosedWithPhase.length > 0
      ? notClosedWithPhase.reduce((sum, c) => sum + (scoresByCall[c.id]?.[phase] || 0), 0) / notClosedWithPhase.length
      : 0;

    return {
      phase,
      avgScoreClosed: Math.round(avgScoreClosed),
      avgScoreNotClosed: Math.round(avgScoreNotClosed),
      scoreDifference: Math.round(avgScoreClosed - avgScoreNotClosed),
      impactOnClose: avgScoreClosed - avgScoreNotClosed > 5 ? 'high' : avgScoreClosed - avgScoreNotClosed > 2 ? 'medium' : 'low',
    };
  });

  // Sort by impact
  phaseCorrelation.sort((a, b) => b.scoreDifference - a.scoreDifference);

  // Rep performance (if manager)
  const repPerformance = Object.keys(repNames).length > 0
    ? Object.entries(
        completedCalls.reduce((acc, c) => {
          if (!acc[c.rep_id]) {
            acc[c.rep_id] = { total: 0, closed: 0, totalScore: 0 };
          }
          acc[c.rep_id].total++;
          if (closedOutcomes.includes(c.outcome!)) acc[c.rep_id].closed++;
          acc[c.rep_id].totalScore += c.overall_score || 0;
          return acc;
        }, {} as Record<string, { total: number; closed: number; totalScore: number }>)
      ).map(([repId, stats]) => ({
        repId,
        repName: repNames[repId] || repId,
        totalCalls: stats.total,
        closedCalls: stats.closed,
        conversionRate: stats.total > 0 ? (stats.closed / stats.total) * 100 : 0,
        avgScore: stats.total > 0 ? stats.totalScore / stats.total : 0,
      })).sort((a, b) => b.conversionRate - a.conversionRate)
    : [];

  // Weekly trend
  const weeklyTrend = calculateWeeklyTrend(completedCalls, closedOutcomes);

  return {
    summary: {
      totalCalls: completedCalls.length,
      closedCalls: closedCalls.length,
      overallConversionRate: Math.round(overallConversionRate * 10) / 10,
      avgScore: completedCalls.length > 0
        ? Math.round(completedCalls.reduce((sum, c) => sum + (c.overall_score || 0), 0) / completedCalls.length)
        : 0,
    },
    outcomeBreakdown,
    conversionByScore,
    phaseCorrelation,
    repPerformance,
    weeklyTrend,
  };
}

function calculateWeeklyTrend(
  calls: CallWithScores[],
  closedOutcomes: string[]
) {
  const weeks: Record<string, { total: number; closed: number }> = {};

  calls.forEach(c => {
    const date = new Date(c.call_date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeks[weekKey]) weeks[weekKey] = { total: 0, closed: 0 };
    weeks[weekKey].total++;
    if (closedOutcomes.includes(c.outcome!)) weeks[weekKey].closed++;
  });

  return Object.entries(weeks)
    .map(([week, stats]) => ({
      week,
      totalCalls: stats.total,
      closedCalls: stats.closed,
      conversionRate: stats.total > 0 ? (stats.closed / stats.total) * 100 : 0,
    }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-12); // Last 12 weeks
}
