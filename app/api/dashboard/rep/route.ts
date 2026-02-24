import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cache, cacheKey, CACHE_TTL } from '@/lib/cache/simple-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check cache first
    const cachedStats = cache.get(cacheKey.repStats(user.id));
    if (cachedStats) {
      return NextResponse.json({ stats: cachedStats, cached: true });
    }

    // Get rep stats using RPC function
    const { data: stats, error: statsError } = await supabase
      .rpc('get_rep_stats', { p_rep_id: user.id });

    if (statsError) {
      console.error('Failed to get rep stats:', statsError);
      // Return default stats if function fails
      return NextResponse.json({
        stats: {
          average_score: 0,
          calls_this_week: 0,
          calls_this_month: 0,
          practice_sessions_this_week: 0,
          score_trend: 0,
          scores_by_phase: [],
        },
      });
    }

    // Cache the stats
    cache.set(cacheKey.repStats(user.id), stats, CACHE_TTL.MEDIUM);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching rep stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
