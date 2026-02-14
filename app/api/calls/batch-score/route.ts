import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  queueCallForScoring,
  getQueueStats,
  retryFailedScoringJobs,
} from '@/lib/queue/scoring-queue';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is manager/admin
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'manager' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const status = await getQueueStats();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Batch score status error:', error);
    return NextResponse.json(
      { error: 'Failed to get queue status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is manager/admin
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'manager' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, callIds } = body;

    if (action === 'score_all') {
      // Retry all failed scoring jobs
      const result = await retryFailedScoringJobs();
      return NextResponse.json({
        message: `Queued ${result.retried} calls for scoring`,
        retried: result.retried,
        errors: result.errors,
      });
    }

    if (action === 'score_selected' && Array.isArray(callIds)) {
      // Validate calls exist
      const { data: calls } = await adminClient
        .from('calls')
        .select('id')
        .in('id', callIds);

      const validCallIds = (calls || []).map((c) => c.id);
      await Promise.all(validCallIds.map(id => queueCallForScoring(id)));

      return NextResponse.json({
        message: `Queued ${validCallIds.length} calls for scoring`,
        queued: validCallIds.length,
        callIds: validCallIds,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Batch score error:', error);
    return NextResponse.json(
      { error: 'Failed to process batch score request' },
      { status: 500 }
    );
  }
}
