import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
      .single();

    if (!profile || (profile.role !== 'manager' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get manager stats using RPC function
    const { data: stats, error: statsError } = await supabase
      .rpc('get_manager_stats');

    if (statsError) {
      console.error('Failed to get manager stats:', statsError);
      // Return default stats if function fails
      return NextResponse.json({
        stats: {
          team_average_score: 0,
          total_calls_this_week: 0,
          reps_below_threshold: 0,
          practice_completion_rate: 0,
          score_distribution: [],
          team_leaderboard: [],
        },
      });
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching manager stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Parse body
    const body = await request.json();
    const { action, profileId, role } = body;

    if (action === 'updateRole') {
      if (!profileId || !role) {
        return NextResponse.json({ error: 'Missing profileId or role' }, { status: 400 });
      }

      const validRoles = ['rep', 'manager', 'admin'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }

      const adminClient = createAdminClient();
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({ role })
        .eq('id', profileId);

      if (updateError) {
        console.error('Failed to update role:', updateError);
        return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in manager PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
