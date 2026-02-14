import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

interface RetryTranscriptionParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RetryTranscriptionParams) {
  const { id: callId } = await params;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
      // Use OpenAI Whisper for transcription
      console.log(`[retry-transcription] Using Whisper for call ${callId}...`);
      const transcriptionResponse = await getOpenAI().audio.transcriptions.create({
        file: new File([fileData], 'audio.mp3', { type: 'audio/mpeg' }),
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      });

      // Parse transcript with content-based speaker detection
      const segments = transcriptionResponse.segments || [];
      const transcript = inferSpeakers(segments);
      const durationSeconds = transcriptionResponse.duration
        ? Math.round(transcriptionResponse.duration)
        : null;

      console.log(`[retry-transcription] Whisper complete: ${transcript.length} segments`);

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

      // Trigger scoring directly (avoid self-fetch anti-pattern)
      const { scoreCall } = await import('@/lib/scoring/score');
      scoreCall(callId).catch(err => console.error('Failed to trigger scoring:', err));

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

interface WhisperSegment {
  start: number;
  end: number;
  text: string;
}

/**
 * Infer speakers from Whisper segments using content analysis
 */
function inferSpeakers(segments: WhisperSegment[]): { speaker: 'rep' | 'prospect'; text: string; start_time: number; end_time: number }[] {
  // Rep indicator patterns (sales language)
  const repPatterns = [
    /\b(my name is|i'm .* (from|with|calling))/i,
    /\b(our (company|service|program|product|team))/i,
    /\b(we (offer|provide|specialize|help|can))/i,
    /\b(let me (explain|tell|share|walk|show))/i,
    /\b(payment|pricing|sign up|enroll|schedule|appointment)/i,
    /\b(great question|absolutely|definitely|exactly right)/i,
  ];

  // Prospect indicator patterns (customer language)
  const prospectPatterns = [
    /\b(my (son|daughter|child|kid|husband|wife))/i,
    /\b(how much|what's the (cost|price))/i,
    /\b(let me (think|talk to|check))/i,
    /\b(i('m| am) (not sure|interested|busy))/i,
    /\b(what (is|are|does)|how (does|do))\b.*\?/i,
  ];

  let lastSpeaker: 'rep' | 'prospect' = 'rep';

  return segments.map((segment) => {
    const text = segment.text.trim();
    if (!text) {
      return {
        speaker: lastSpeaker,
        text,
        start_time: segment.start,
        end_time: segment.end,
      };
    }

    let repScore = 0;
    let prospectScore = 0;

    repPatterns.forEach(pattern => {
      if (pattern.test(text)) repScore += 2;
    });

    prospectPatterns.forEach(pattern => {
      if (pattern.test(text)) prospectScore += 2;
    });

    // Questions often from prospects
    if (/\?$/.test(text.trim())) {
      prospectScore += 1;
    }

    // Short responses like "okay", "yes" - likely prospect
    if (text.length < 20 && /^(okay|yes|yeah|uh|um|right|sure|no|hmm)/i.test(text)) {
      prospectScore += 1;
    }

    let speaker: 'rep' | 'prospect';
    if (repScore > prospectScore) {
      speaker = 'rep';
    } else if (prospectScore > repScore) {
      speaker = 'prospect';
    } else {
      speaker = lastSpeaker === 'rep' ? 'prospect' : 'rep';
    }

    lastSpeaker = speaker;

    return {
      speaker,
      text,
      start_time: segment.start,
      end_time: segment.end,
    };
  });
}
