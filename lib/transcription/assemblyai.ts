import { AssemblyAI, TranscriptUtterance } from 'assemblyai';
import type { TranscriptSegment } from '@/types/database';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

export interface TranscriptionResult {
  transcript: TranscriptSegment[];
  duration: number;
  confidence: number;
}

/**
 * Transcribe audio with speaker diarization using AssemblyAI
 * Returns properly labeled transcript segments with speaker identification
 */
export async function transcribeWithDiarization(
  audioUrl: string
): Promise<TranscriptionResult> {
  console.log('[AssemblyAI] Starting transcription with speaker diarization...');

  const transcript = await client.transcripts.transcribe({
    audio: audioUrl,
    speaker_labels: true,
    speakers_expected: 2, // Rep and prospect
  });

  if (transcript.status === 'error') {
    throw new Error(`Transcription failed: ${transcript.error}`);
  }

  const utterances = transcript.utterances || [];

  // Map speakers to rep/prospect
  // Strategy: The speaker who talks first is typically the rep (they initiate the call)
  // We also check for common rep patterns in early utterances
  const speakerMapping = determineSpeakerRoles(utterances);

  const segments: TranscriptSegment[] = utterances.map((utterance) => ({
    speaker: speakerMapping[utterance.speaker] || 'rep',
    text: utterance.text,
    start_time: utterance.start / 1000, // Convert ms to seconds
    end_time: utterance.end / 1000,
  }));

  console.log(`[AssemblyAI] Transcription complete: ${segments.length} segments, ${transcript.audio_duration}s duration`);

  return {
    transcript: segments,
    duration: transcript.audio_duration || 0,
    confidence: transcript.confidence || 0,
  };
}

/**
 * Transcribe from a file buffer (upload to AssemblyAI first)
 */
export async function transcribeFileWithDiarization(
  fileBuffer: Buffer,
  fileName: string
): Promise<TranscriptionResult> {
  console.log(`[AssemblyAI] Uploading file: ${fileName}...`);

  // Upload the file to AssemblyAI
  const uploadUrl = await client.files.upload(fileBuffer);

  console.log('[AssemblyAI] File uploaded, starting transcription...');

  return transcribeWithDiarization(uploadUrl);
}

/**
 * Determine which speaker is the rep and which is the prospect
 * Uses multiple heuristics with weighted scoring:
 * 1. Talk time ratio (reps typically talk more in sales calls)
 * 2. Introduction patterns and professional language
 * 3. Sales-specific language and terminology
 * 4. Question patterns (prospects ask more questions)
 * 5. Response patterns (reps provide more explanations)
 */
function determineSpeakerRoles(
  utterances: TranscriptUtterance[]
): Record<string, 'rep' | 'prospect'> {
  if (utterances.length === 0) {
    return {};
  }

  const speakers = [...new Set(utterances.map(u => u.speaker))];

  // Track detailed metrics per speaker
  const speakerMetrics: Record<string, {
    totalTalkTime: number;
    utteranceCount: number;
    avgUtteranceLength: number;
    repScore: number;
    prospectScore: number;
    questionCount: number;
    firstSpeakerBonus: number;
  }> = {};

  // Initialize metrics
  speakers.forEach(s => {
    speakerMetrics[s] = {
      totalTalkTime: 0,
      utteranceCount: 0,
      avgUtteranceLength: 0,
      repScore: 0,
      prospectScore: 0,
      questionCount: 0,
      firstSpeakerBonus: 0,
    };
  });

  // Strong rep indicators (high weight)
  const strongRepPatterns = [
    /\b(my name is|i'm .* (from|with|at)|this is .* (from|calling))/i,
    /\b(calling (from|on behalf|about|regarding))/i,
    /\b(our (company|service|program|product|team|solution))/i,
    /\b(we (offer|provide|specialize|help|work with))/i,
    /\b(let me (tell|explain|share|walk you through|show))/i,
  ];

  // Moderate rep indicators
  const moderateRepPatterns = [
    /\b(payment (plan|option)|pricing|investment|cost is|that's \$)/i,
    /\b(sign up|get started|enroll|register|book|schedule)/i,
    /\b(guarantee|no risk|money back|free trial)/i,
    /\b(what (works|brings you|made you|are you looking))/i,
    /\b(i (understand|hear|appreciate|see what you mean))/i,
    /\b(great question|absolutely|definitely|exactly)/i,
    /\b(the (benefit|advantage|difference|reason))/i,
    /\b(how does that sound|does that make sense|any questions)/i,
  ];

  // Product/service specific patterns (tutoring context)
  const productRepPatterns = [
    /\b(tutoring|tutor|lessons?|sessions?|curriculum)/i,
    /\b(myedspace|eddie|math|algebra|geometry|calculus)/i,
    /\b(teacher|instructor|educator)/i,
    /\b(progress|improvement|grades|scores|results)/i,
  ];

  // Strong prospect indicators (high weight)
  const strongProspectPatterns = [
    /\b(my (son|daughter|child|kid|husband|wife|spouse)('s)?)/i,
    /\b(i('m| am) (not sure|thinking|considering|looking))/i,
    /\b(let me (think|talk to|check with|discuss))/i,
    /\b(i('ll| will) (need to|have to|get back))/i,
    /\b(we('ll| will)? (think about|consider|discuss))/i,
  ];

  // Moderate prospect indicators
  const moderateProspectPatterns = [
    /\b(how much|what's the (price|cost)|can i afford)/i,
    /\b(what (is|are|does|do you)|how (does|do|long|often))/i,
    /\b(can you (explain|tell me|send me))/i,
    /\b(i('m| am) (worried|concerned|hesitant|unsure))/i,
    /\b(that's (expensive|a lot|too much))/i,
    /\b(i don't (know|think|have))/i,
    /\b(maybe|perhaps|possibly|i guess)/i,
    /\b(we('re| are)? (busy|not sure|undecided))/i,
  ];

  // Question detection pattern
  const questionPattern = /\?|^(what|how|when|where|why|who|which|can|could|would|is|are|do|does|will|have|has)\b/i;

  // Analyze each utterance
  utterances.forEach((utterance, index) => {
    const speaker = utterance.speaker;
    const text = utterance.text;
    const talkTime = (utterance.end - utterance.start) / 1000;
    const metrics = speakerMetrics[speaker];

    metrics.totalTalkTime += talkTime;
    metrics.utteranceCount += 1;

    // First speaker gets a small bonus (often the rep initiates)
    if (index === 0) {
      metrics.firstSpeakerBonus = 3;
    }

    // Check for questions (prospects ask more questions)
    if (questionPattern.test(text)) {
      metrics.questionCount += 1;
    }

    // Score rep patterns
    strongRepPatterns.forEach(pattern => {
      if (pattern.test(text)) metrics.repScore += 5;
    });
    moderateRepPatterns.forEach(pattern => {
      if (pattern.test(text)) metrics.repScore += 2;
    });
    productRepPatterns.forEach(pattern => {
      if (pattern.test(text)) metrics.repScore += 1;
    });

    // Score prospect patterns
    strongProspectPatterns.forEach(pattern => {
      if (pattern.test(text)) metrics.prospectScore += 5;
    });
    moderateProspectPatterns.forEach(pattern => {
      if (pattern.test(text)) metrics.prospectScore += 2;
    });
  });

  // Calculate final scores with all factors
  const finalScores: Record<string, number> = {};

  speakers.forEach(speaker => {
    const m = speakerMetrics[speaker];
    m.avgUtteranceLength = m.utteranceCount > 0 ? m.totalTalkTime / m.utteranceCount : 0;

    // Start with pattern-based scores
    let score = m.repScore - m.prospectScore;

    // Add first speaker bonus
    score += m.firstSpeakerBonus;

    // Reps typically talk more - bonus for more talk time
    // (This is calculated relative to other speakers later)

    // Questions indicate prospect behavior (reps explain, prospects ask)
    const questionRatio = m.utteranceCount > 0 ? m.questionCount / m.utteranceCount : 0;
    score -= questionRatio * 10; // High question ratio = more likely prospect

    // Longer average utterances suggest rep (explaining things)
    if (m.avgUtteranceLength > 10) {
      score += 2;
    }

    finalScores[speaker] = score;
  });

  // Talk time comparison: speaker with more talk time is more likely rep
  if (speakers.length >= 2) {
    const totalTalkTimes = speakers.map(s => ({
      speaker: s,
      time: speakerMetrics[s].totalTalkTime
    })).sort((a, b) => b.time - a.time);

    const maxTime = totalTalkTimes[0].time;
    const secondTime = totalTalkTimes[1]?.time || 0;

    // If one speaker talks significantly more (>30% more), they're likely the rep
    if (maxTime > secondTime * 1.3) {
      finalScores[totalTalkTimes[0].speaker] += 5;
    }
  }

  // Assign roles based on final scores
  const sortedSpeakers = Object.entries(finalScores)
    .sort(([, a], [, b]) => b - a);

  const mapping: Record<string, 'rep' | 'prospect'> = {};

  if (sortedSpeakers.length >= 2) {
    mapping[sortedSpeakers[0][0]] = 'rep';
    mapping[sortedSpeakers[1][0]] = 'prospect';
    // Any additional speakers default to prospect
    sortedSpeakers.slice(2).forEach(([speaker]) => {
      mapping[speaker] = 'prospect';
    });
  } else if (sortedSpeakers.length === 1) {
    mapping[sortedSpeakers[0][0]] = 'rep';
  }

  console.log('[AssemblyAI] Speaker analysis:', {
    metrics: speakerMetrics,
    finalScores,
    mapping
  });

  return mapping;
}

/**
 * Check if AssemblyAI is configured
 */
export function isAssemblyAIConfigured(): boolean {
  return !!process.env.ASSEMBLYAI_API_KEY;
}
