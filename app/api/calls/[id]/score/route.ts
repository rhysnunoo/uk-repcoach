import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { scoreCall, rescoreCall } from '@/lib/scoring/score';

interface ScoreRouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: ScoreRouteParams) {
  const { id: callId } = await params;

  try {
    // Check if rescore is requested
    const url = new URL(request.url);
    const rescore = url.searchParams.get('rescore') === 'true';

    // Use the centralized scoring function
    const result = rescore
      ? await rescoreCall(callId)
      : await scoreCall(callId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Scoring error:', error);

    // Update call status to error
    const adminClient = createAdminClient();
    await adminClient
      .from('calls')
      .update({
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Scoring failed',
      })
      .eq('id', callId);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scoring failed' },
      { status: 500 }
    );
  }
}
