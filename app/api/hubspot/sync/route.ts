import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncHubspotCalls } from '@/lib/hubspot/sync';

export async function POST(request: NextRequest) {
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

    // Parse optional body
    const body = await request.json().catch(() => ({}));
    const sinceTimestamp = body.since as string | undefined;
    const minDuration = body.minDuration as number | undefined;

    // Run sync
    const result = await syncHubspotCalls('manual', sinceTimestamp, minDuration);

    return NextResponse.json({
      success: true,
      synced: result.synced,
      failed: result.failed,
      skipped: result.skipped,
      transcribing: result.transcribing,
      errors: result.errors.slice(0, 10), // Limit errors returned
    });
  } catch (error) {
    console.error('HubSpot sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    // Get sync history
    const { data: syncLogs, error: logsError } = await supabase
      .from('hubspot_sync_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20);

    if (logsError) {
      return NextResponse.json({ error: 'Failed to fetch sync history' }, { status: 500 });
    }

    return NextResponse.json({ logs: syncLogs });
  } catch (error) {
    console.error('Error fetching sync history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
