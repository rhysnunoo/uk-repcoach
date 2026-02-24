import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getQueueStats, retryFailedScoringJobs } from '@/lib/queue/scoring-queue';

// GET - Get queue statistics
export async function GET() {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a manager/admin
    const { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'manager' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admins only' }, { status: 403 });
    }

    const stats = await getQueueStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Queue stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch queue stats' }, { status: 500 });
  }
}

// POST - Retry failed jobs
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a manager/admin
    const { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'manager' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admins only' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'retry-failed') {
      const result = await retryFailedScoringJobs();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Queue action error:', error);
    return NextResponse.json({ error: 'Failed to perform queue action' }, { status: 500 });
  }
}
