import { createAdminClient } from '@/lib/supabase/admin';
import OpenAI from 'openai';
import { createScoringSystemPrompt, createScoringUserPrompt } from './prompt';
import { parseScoringResponse, calculateOverallScore, generateFallbackScores } from './parse';
import { invalidateCallCache, invalidateTeamCache } from '@/lib/cache/simple-cache';
import type { ScriptContent, TranscriptSegment } from '@/types/database';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export interface ScoreResult {
  success: boolean;
  overall_score: number;
  scores: Array<{
    phase: string;
    score: number;
    feedback: string;
    highlights: string[];
    improvements: string[];
    quotes: Array<{ text: string; sentiment: string; timestamp?: number }>;
  }>;
  summary?: string;
  objections_detected?: Array<{
    objection: string;
    category: string;
    handling_score: number;
    feedback: string;
  }>;
  error?: string;
}

/**
 * Score a call using GPT-4 against the CLOSER framework
 */
export async function scoreCall(callId: string): Promise<ScoreResult> {
  const adminClient = createAdminClient();

  // Fetch call with transcript
  const { data: call, error: callError } = await adminClient
    .from('calls')
    .select('*')
    .eq('id', callId)
    .single();

  if (callError || !call) {
    throw new Error('Call not found');
  }

  if (!call.transcript || (call.transcript as TranscriptSegment[]).length === 0) {
    throw new Error('No transcript available for scoring');
  }

  // Use default scoring (no script-specific content)
  const scriptContent = {} as ScriptContent;

  // Update status
  await adminClient
    .from('calls')
    .update({ status: 'scoring' })
    .eq('id', callId);

  // Create prompts
  const systemPrompt = createScoringSystemPrompt(scriptContent);
  const userPrompt = createScoringUserPrompt(call.transcript as TranscriptSegment[]);

  // Call GPT-4 with retries
  let scoringResponse = null;
  let lastError = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`[scoreCall] Attempt ${attempt + 1} for call ${callId}`);

      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        scoringResponse = parseScoringResponse(content);
        if (scoringResponse) break;
      }
    } catch (error) {
      lastError = error;
      console.error(`[scoreCall] Attempt ${attempt + 1} failed:`, error);
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
      }
    }
  }

  // Use fallback if all attempts failed
  if (!scoringResponse) {
    console.error('[scoreCall] All scoring attempts failed:', lastError);
    scoringResponse = generateFallbackScores();
  }

  // Calculate final overall score
  const overallScore = calculateOverallScore(scoringResponse.scores);

  // Save scores to database
  const scoresToInsert = scoringResponse.scores.map((score) => ({
    call_id: callId,
    phase: score.phase,
    score: score.score,
    feedback: score.feedback,
    highlights: score.highlights,
    improvements: score.improvements,
    quotes: score.quotes,
  }));

  // Delete existing scores if any
  await adminClient.from('scores').delete().eq('call_id', callId);

  // Insert new scores
  const { error: scoresError } = await adminClient
    .from('scores')
    .insert(scoresToInsert);

  if (scoresError) {
    console.error('[scoreCall] Failed to save scores:', scoresError);
    throw new Error('Failed to save scores');
  }

  // Update call with overall score and summary
  await adminClient
    .from('calls')
    .update({
      status: 'complete',
      overall_score: overallScore,
      summary: scoringResponse.summary,
      error_message: null,
    })
    .eq('id', callId);

  console.log(`[scoreCall] Successfully scored call ${callId} with score ${overallScore}`);

  // Invalidate related caches
  invalidateCallCache(callId);
  invalidateTeamCache();

  return {
    success: true,
    overall_score: overallScore,
    scores: scoringResponse.scores,
    summary: scoringResponse.summary,
    objections_detected: scoringResponse.objections_detected,
  };
}

/**
 * Re-score a call (delete existing scores and score again)
 */
export async function rescoreCall(callId: string): Promise<ScoreResult> {
  const adminClient = createAdminClient();

  // Delete existing scores
  await adminClient.from('scores').delete().eq('call_id', callId);

  // Score again
  return scoreCall(callId);
}
