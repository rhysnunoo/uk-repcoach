import OpenAI from 'openai';
import type { TranscriptSegment } from '@/types/database';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

interface WhisperSegment {
  start: number;
  end: number;
  text: string;
}

// Type for OpenAI Whisper verbose_json response
interface VerboseTranscriptionResponse {
  text: string;
  language: string;
  duration: number;
  segments: WhisperSegment[];
}

interface TranscriptionResult {
  segments: TranscriptSegment[];
  duration: number;
  rawText: string;
}

/**
 * Transcribe audio using OpenAI Whisper API
 * Cost: ~$0.006 per minute of audio
 */
export async function transcribeWithWhisper(
  audioUrl: string,
  options?: {
    language?: string;
    prompt?: string;
  }
): Promise<TranscriptionResult> {
  // Download the audio file
  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error(`Failed to download audio: ${audioResponse.status}`);
  }

  const audioBlob = await audioResponse.blob();

  // Convert blob to File object for OpenAI API
  const audioFile = new File([audioBlob], 'recording.mp3', {
    type: audioBlob.type || 'audio/mpeg',
  });

  // Transcribe with Whisper - use verbose_json for segments
  const transcription = await getOpenAI().audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
    language: options?.language,
    prompt: options?.prompt,
  });

  // Parse segments from Whisper verbose_json response
  const verboseResponse = transcription as unknown as VerboseTranscriptionResponse;
  const whisperSegments = verboseResponse.segments || [];

  // Convert to our TranscriptSegment format
  // Whisper doesn't do speaker diarization, so we'll use content analysis
  const segments = assignSpeakersToSegments(whisperSegments);

  return {
    segments,
    duration: verboseResponse.duration || 0,
    rawText: transcription.text,
  };
}

/**
 * Assign speakers to segments using content analysis
 * Since Whisper doesn't provide speaker diarization, we analyze content
 * to determine who is likely speaking
 */
function assignSpeakersToSegments(whisperSegments: WhisperSegment[]): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];

  // Rep indicator patterns (sales language)
  const repPatterns = [
    /\b(my name is|i'm .* (from|with|calling))/i,
    /\b(our (company|service|program|product|team))/i,
    /\b(we (offer|provide|specialize|help|can))/i,
    /\b(let me (explain|tell|share|walk|show))/i,
    /\b(payment|pricing|sign up|enroll|schedule|appointment)/i,
    /\b(great question|absolutely|definitely|exactly right)/i,
    /\b(i('d| would) (love|like) to|can i ask)/i,
    /\b(thanks for (taking|your)|appreciate your time)/i,
  ];

  // Prospect indicator patterns (customer language)
  const prospectPatterns = [
    /\b(my (son|daughter|child|kid|husband|wife|mother|father))/i,
    /\b(how much|what's the (cost|price)|can i afford)/i,
    /\b(let me (think|talk to|check|ask))/i,
    /\b(i('m| am) (not sure|interested|thinking|considering|busy))/i,
    /\b(what (is|are|does)|how (does|do|long|often))\b.*\?/i,
    /\b(who (is|are) (this|you|calling))/i,
    /\b(send me|email me|call me back)/i,
    /\b(i (already|don't|can't|won't))/i,
  ];

  let lastSpeaker: 'rep' | 'prospect' = 'rep'; // Assume rep starts the call

  for (const segment of whisperSegments) {
    const text = segment.text.trim();
    if (!text) continue;

    // Score the segment
    let repScore = 0;
    let prospectScore = 0;

    repPatterns.forEach(pattern => {
      if (pattern.test(text)) repScore += 2;
    });

    prospectPatterns.forEach(pattern => {
      if (pattern.test(text)) prospectScore += 2;
    });

    // Questions at end often from prospects
    if (/\?$/.test(text.trim())) {
      prospectScore += 1;
    }

    // Short responses like "okay", "yes", "uh huh" - likely prospect
    if (text.length < 20 && /^(okay|yes|yeah|uh|um|right|sure|no|hmm)/i.test(text)) {
      prospectScore += 1;
    }

    // Determine speaker
    let speaker: 'rep' | 'prospect';
    if (repScore > prospectScore) {
      speaker = 'rep';
    } else if (prospectScore > repScore) {
      speaker = 'prospect';
    } else {
      // If scores equal, alternate from last speaker
      speaker = lastSpeaker === 'rep' ? 'prospect' : 'rep';
    }

    segments.push({
      speaker,
      text,
      start_time: Math.round(segment.start),
      end_time: Math.round(segment.end),
    });

    lastSpeaker = speaker;
  }

  // Post-process: merge consecutive segments from same speaker
  return mergeConsecutiveSegments(segments);
}

/**
 * Merge consecutive segments from the same speaker
 */
function mergeConsecutiveSegments(segments: TranscriptSegment[]): TranscriptSegment[] {
  if (segments.length === 0) return [];

  const merged: TranscriptSegment[] = [];
  let current = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];

    // If same speaker and within 2 seconds, merge
    if (segment.speaker === current.speaker &&
        segment.start_time - current.end_time <= 2) {
      current.text += ' ' + segment.text;
      current.end_time = segment.end_time;
    } else {
      merged.push(current);
      current = { ...segment };
    }
  }

  merged.push(current);
  return merged;
}

/**
 * Transcribe audio with speaker diarization using a two-pass approach
 * First transcribes, then analyzes for speaker changes
 */
export async function transcribeWithDiarization(
  audioUrl: string
): Promise<TranscriptionResult> {
  // For now, use the basic transcription with content-based speaker detection
  // In the future, could integrate a dedicated diarization service
  return transcribeWithWhisper(audioUrl, {
    prompt: 'This is a sales call between a sales representative and a prospect.',
  });
}
