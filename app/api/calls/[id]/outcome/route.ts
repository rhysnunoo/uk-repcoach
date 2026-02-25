import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
interface OutcomeRouteParams {
  params: Promise<{ id: string }>;
}

const VALID_OUTCOMES = ['annual', 'monthly', 'trial', 'no_sale', 'callback', 'voicemail', null];

export async function PATCH(request: NextRequest, { params }: OutcomeRouteParams) {
  const { id: callId } = await params;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { outcome } = await request.json();

    if (!VALID_OUTCOMES.includes(outcome)) {
      return NextResponse.json({ error: 'Invalid outcome' }, { status: 400 });
    }

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
