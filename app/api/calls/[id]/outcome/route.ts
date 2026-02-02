import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface OutcomeRouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: OutcomeRouteParams) {
  const { id: callId } = await params;

  try {
    const { outcome } = await request.json();

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('calls')
      .update({ outcome })
      .eq('id', callId);

    if (error) {
      console.error('Failed to update outcome:', error);
      return NextResponse.json({ error: 'Failed to update outcome' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Outcome update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
