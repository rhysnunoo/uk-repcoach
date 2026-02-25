import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get rep_id from query params or use current user
    const searchParams = request.nextUrl.searchParams;
    const repId = searchParams.get('repId') || user.id;

    // Check if user can view this rep's data
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isManager = profile?.role === 'manager' || profile?.role === 'admin';
    if (!isManager && repId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all scores for this rep's calls in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: calls } = await adminClient
      .from('calls')
      .select('id, call_date, overall_score')
      .eq('rep_id', repId)
      .eq('status', 'complete')
      .gte('call_date', thirtyDaysAgo.toISOString())
      .order('call_date', { ascending: true });

    if (!calls || calls.length === 0) {
      return NextResponse.json({
        phaseAverages: [],
        weakestPhases: [],
        strongestPhases: [],
        recentTrend: [],
        callCount: 0,
      });
    }

    // Fetch all scores for these calls
    const callIds = calls.map(c => c.id);
    const { data: scores } = await adminClient
      .from('scores')
      .select('*')
      .in('call_id', callIds);

    if (!scores) {
      return NextResponse.json({
        phaseAverages: [],
        weakestPhases: [],
        strongestPhases: [],
        recentTrend: [],
        callCount: calls.length,
      });
    }

    // Calculate average by phase
    const phaseScores: Record<string, { sum: number; count: number; scores: number[] }> = {};
    const PHASE_LABELS: Record<string, string> = {
      opening: 'Opening',
      clarify: 'Clarify',
      label: 'Label',
      overview: 'Overview/Pain',
      sell_vacation: 'Sell Vacation',
      price_presentation: 'Price Presentation',
      explain: 'Objections (AAA)',
      reinforce: 'Close',
    };

    for (const score of scores) {
      if (!phaseScores[score.phase]) {
        phaseScores[score.phase] = { sum: 0, count: 0, scores: [] };
      }
      phaseScores[score.phase].sum += score.score;
      phaseScores[score.phase].count++;
      phaseScores[score.phase].scores.push(score.score);
    }

    const phaseAverages = Object.entries(phaseScores)
      .map(([phase, data]) => ({
        phase,
        label: PHASE_LABELS[phase] || phase,
        average: Math.round(data.sum / data.count),
        count: data.count,
        variance: calculateVariance(data.scores),
      }))
      .sort((a, b) => a.average - b.average);

    // Get weakest and strongest
    const weakestPhases = phaseAverages.slice(0, 3);
    const strongestPhases = [...phaseAverages].sort((a, b) => b.average - a.average).slice(0, 3);

    // Calculate recent trend (last 5 calls vs previous 5)
    const recentCalls = calls.slice(-10);
    const recentTrend = recentCalls.map(c => ({
      date: c.call_date,
      score: c.overall_score,
    }));

    // Calculate improvement suggestions
    const suggestions = generateSuggestions(weakestPhases);

    return NextResponse.json({
      phaseAverages,
      weakestPhases,
      strongestPhases,
      recentTrend,
      callCount: calls.length,
      overallAverage: Math.round(calls.reduce((sum, c) => sum + (c.overall_score || 0), 0) / calls.length),
      suggestions,
    });
  } catch (error) {
    console.error('Weak spots API error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

function calculateVariance(scores: number[]): number {
  if (scores.length < 2) return 0;
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const squaredDiffs = scores.map(s => Math.pow(s - mean, 2));
  return Math.round(Math.sqrt(squaredDiffs.reduce((sum, d) => sum + d, 0) / scores.length));
}

function generateSuggestions(weakestPhases: Array<{ phase: string; label: string; average: number }>): string[] {
  const suggestions: string[] = [];

  for (const phase of weakestPhases) {
    switch (phase.phase) {
      case 'opening':
        suggestions.push('Practice your opening: Focus on credibility statement and setting a clear agenda');
        break;
      case 'clarify':
        suggestions.push('Ask more open-ended questions and uncover the urgency trigger ("What made you reach out NOW?")');
        break;
      case 'label':
        suggestions.push('Always confirm understanding by restating the problem and asking "Is that accurate?"');
        break;
      case 'overview':
        suggestions.push('Spend more time on pain exploration - ask "What else have you tried?" multiple times');
        break;
      case 'sell_vacation':
        suggestions.push('Lead with teacher credentials and paint the outcome picture before features');
        break;
      case 'price_presentation':
        suggestions.push('Check for buy-in BEFORE presenting price, and lead with the annual plan');
        break;
      case 'explain':
        suggestions.push('Use the AAA framework: Acknowledge, Associate, Ask - never answer objections directly');
        break;
      case 'reinforce':
        suggestions.push('Stop selling once they agree - focus on clear next steps and create urgency');
        break;
    }
  }

  return suggestions.slice(0, 3);
}
