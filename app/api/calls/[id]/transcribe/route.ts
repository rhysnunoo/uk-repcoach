import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { transcribeWithDiarization, isAssemblyAIConfigured } from '@/lib/transcription/assemblyai';
import { scoreCall } from '@/lib/scoring/score';

interface TranscribeRouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: TranscribeRouteParams) {
  const { id: callId } = await params;
  const adminClient = createAdminClient();

  try {
    // Check if AssemblyAI is configured
    if (!isAssemblyAIConfigured()) {
      return NextResponse.json(
        { error: 'Transcription service not configured' },
        { status: 503 }
      );
    }

    // Get recording URL from body or from the call record
    let recordingUrl: string | null = null;

    try {
      const body = await request.json();
      recordingUrl = body.recordingUrl;
    } catch {
      // No body provided, will fetch from call record
    }

    // Fetch the call
    const { data: call, error: callError } = await adminClient
      .from('calls')
      .select('id, recording_url, status, transcript')
      .eq('id', callId)
      .single();

    if (callError || !call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Use provided URL or fall back to call's recording URL
    recordingUrl = recordingUrl || call.recording_url;

    if (!recordingUrl) {
      return NextResponse.json(
        { error: 'No recording URL available for transcription' },
        { status: 400 }
      );
    }

    // Skip if already has transcript
    if (call.transcript && Array.isArray(call.transcript) && call.transcript.length > 0) {
      console.log(`[Transcribe] Call ${callId} already has transcript, skipping`);
      return NextResponse.json({
        message: 'Call already has transcript',
        callId,
        status: 'skipped'
      });
    }

    // Update status to transcribing
    await adminClient
      .from('calls')
      .update({ status: 'transcribing' })
      .eq('id', callId);

    console.log(`[Transcribe] Starting transcription for call ${callId}...`);

    // Transcribe with AssemblyAI
    const result = await transcribeWithDiarization(recordingUrl);

    // Update call with transcript and duration
    const { error: updateError } = await adminClient
      .from('calls')
      .update({
        transcript: result.transcript,
        duration_seconds: result.duration || call.duration_seconds,
        status: 'scoring', // Ready for scoring
      })
      .eq('id', callId);

    if (updateError) {
      throw new Error(`Failed to save transcript: ${updateError.message}`);
    }

    console.log(`[Transcribe] Transcription complete for call ${callId}, triggering scoring...`);

    // Trigger scoring
    try {
      await scoreCall(callId);
      console.log(`[Transcribe] Scoring complete for call ${callId}`);
    } catch (scoreError) {
      console.error(`[Transcribe] Scoring failed for call ${callId}:`, scoreError);
      // Update status to indicate scoring failed but transcript succeeded
      await adminClient
        .from('calls')
        .update({
          status: 'error',
          error_message: `Transcription succeeded but scoring failed: ${
            scoreError instanceof Error ? scoreError.message : 'Unknown error'
          }`,
        })
        .eq('id', callId);
    }

    return NextResponse.json({
      message: 'Transcription complete',
      callId,
      segmentCount: result.transcript.length,
      duration: result.duration,
      confidence: result.confidence,
    });
  } catch (error) {
    console.error('[Transcribe] Error:', error);

    // Update call status to error
    await adminClient
      .from('calls')
      .update({
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Transcription failed',
      })
      .eq('id', callId);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Transcription failed' },
      { status: 500 }
    );
  }
}
