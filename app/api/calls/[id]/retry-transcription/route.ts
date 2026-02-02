import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import OpenAI from 'openai';
import {
  transcribeFileWithDiarization,
  isAssemblyAIConfigured
} from '@/lib/transcription/assemblyai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RetryTranscriptionParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RetryTranscriptionParams) {
  const { id: callId } = await params;

  try {
    const adminClient = createAdminClient();

    // Fetch the call
    const { data: call, error: fetchError } = await adminClient
      .from('calls')
      .select('storage_path, status')
      .eq('id', callId)
      .single();

    if (fetchError || !call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    if (!call.storage_path) {
      return NextResponse.json({ error: 'No audio file to transcribe' }, { status: 400 });
    }

    // Update status
    await adminClient
      .from('calls')
      .update({ status: 'transcribing', error_message: null })
      .eq('id', callId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from('call-recordings')
      .download(call.storage_path);

    if (downloadError || !fileData) {
      await adminClient
        .from('calls')
        .update({ status: 'error', error_message: 'Failed to download audio file' })
        .eq('id', callId);
      return NextResponse.json({ error: 'Failed to download audio file' }, { status: 500 });
    }

    try {
      let transcript: { speaker: 'rep' | 'prospect'; text: string; start_time: number; end_time: number }[];
      let durationSeconds: number | null = null;

      // Use AssemblyAI if configured (better speaker diarization)
      if (isAssemblyAIConfigured()) {
        console.log(`[retry-transcription] Using AssemblyAI for call ${callId}...`);
        const fileBuffer = Buffer.from(await fileData.arrayBuffer());
        const result = await transcribeFileWithDiarization(fileBuffer, 'audio.mp3');
        transcript = result.transcript;
        durationSeconds = Math.round(result.duration);
        console.log(`[retry-transcription] AssemblyAI complete: ${transcript.length} segments`);
      } else {
        // Fallback to Whisper
        console.log(`[retry-transcription] Using Whisper for call ${callId}...`);
        const transcriptionResponse = await openai.audio.transcriptions.create({
          file: new File([fileData], 'audio.mp3', { type: 'audio/mpeg' }),
          model: 'whisper-1',
          response_format: 'verbose_json',
          timestamp_granularities: ['segment'],
        });

        // Parse transcript with simple alternating speaker pattern
        const segments = transcriptionResponse.segments || [];
        transcript = segments.map((segment, index) => ({
          speaker: (index % 2 === 0 ? 'rep' : 'prospect') as 'rep' | 'prospect',
          text: segment.text.trim(),
          start_time: segment.start,
          end_time: segment.end,
        }));

        durationSeconds = transcriptionResponse.duration
          ? Math.round(transcriptionResponse.duration)
          : null;
      }

      // Update with transcript
      await adminClient
        .from('calls')
        .update({
          status: 'scoring',
          transcript,
          duration_seconds: durationSeconds,
          error_message: null,
        })
        .eq('id', callId);

      // Trigger scoring
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      fetch(`${baseUrl}/api/calls/${callId}/score`, {
        method: 'POST',
      }).catch(err => console.error('Failed to trigger scoring:', err));

      return NextResponse.json({ success: true, message: 'Transcription complete, scoring in progress' });
    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError);
      await adminClient
        .from('calls')
        .update({
          status: 'error',
          error_message: transcriptionError instanceof Error ? transcriptionError.message : 'Transcription failed',
        })
        .eq('id', callId);
      return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Retry transcription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
