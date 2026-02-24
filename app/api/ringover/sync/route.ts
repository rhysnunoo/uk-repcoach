import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncRingoverCalls } from '@/lib/ringover/sync';

export async function POST(request: Request) {
  const supabase = await createClient();

  // Check user is authenticated and has manager/admin role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || !['manager', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const minDuration = body.minDuration || 60;

    // Default to syncing last 7 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const result = await syncRingoverCalls('manual', startDate, minDuration);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Ringover sync failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const supabase = await createClient();

  // Check user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const adminClient = createAdminClient();

    // Get recent sync logs
    const { data: logs, error } = await adminClient
      .from('ringover_sync_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (error) {
    console.error('Failed to fetch sync logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync logs', logs: [] },
      { status: 500 }
    );
  }
}
