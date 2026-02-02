import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface SwapSpeakersParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: SwapSpeakersParams) {
  const { id: callId } = await params;

  try {
    const adminClient = createAdminClient();

    // Fetch the call
    const { data: call, error: fetchError } = await adminClient
      .from('calls')
      .select('transcript')
      .eq('id', callId)
      .single();

    if (fetchError || !call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    if (!call.transcript || !Array.isArray(call.transcript)) {
      return NextResponse.json({ error: 'No transcript to swap' }, { status: 400 });
    }

    // Swap speaker labels
    const swappedTranscript = call.transcript.map((segment: { speaker: string; text: string; start_time: number; end_time: number }) => ({
      ...segment,
      speaker: (segment.speaker === 'rep' ? 'prospect' : 'rep') as 'rep' | 'prospect',
    }));

    // Update the call
    const { error: updateError } = await adminClient
      .from('calls')
      .update({
        transcript: swappedTranscript,
        // Reset scoring status so it can be re-scored
        status: 'scoring',
        overall_score: null,
      })
      .eq('id', callId);

    if (updateError) {
      console.error('Failed to update transcript:', updateError);
      return NextResponse.json({ error: 'Failed to update transcript' }, { status: 500 });
    }

    // Delete existing scores
    await adminClient
      .from('scores')
      .delete()
      .eq('call_id', callId);

    // Trigger re-scoring
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    fetch(`${baseUrl}/api/calls/${callId}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(err => console.error('Failed to trigger scoring:', err));

    return NextResponse.json({ success: true, message: 'Speakers swapped, re-scoring in progress' });
  } catch (error) {
    console.error('Swap speakers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
