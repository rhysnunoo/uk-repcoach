import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface StatusRouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: StatusRouteParams) {
  const { id: callId } = await params;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const adminClient = createAdminClient();

    const { data: call, error } = await adminClient
      .from('calls')
      .select('status, overall_score, error_message')
      .eq('id', callId)
      .single();

    if (error || !call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: call.status,
      overall_score: call.overall_score,
      error_message: call.error_message,
    });
  } catch (error) {
    console.error('Error fetching call status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
