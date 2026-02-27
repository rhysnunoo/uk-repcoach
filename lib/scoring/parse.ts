import { z } from 'zod';

// Zod schemas for validating GPT-4 response
const quoteSchema = z.object({
  text: z.string(),
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  timestamp: z.number().optional(),
});

const ALL_PHASES = ['opening', 'clarify', 'label', 'overview', 'sell_vacation', 'price_presentation', 'explain', 'reinforce'] as const;

const phaseScoreSchema = z.object({
  phase: z.enum(ALL_PHASES),
  score: z.number().min(0).max(100),
  feedback: z.string(),
  highlights: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  quotes: z.array(quoteSchema).default([]),
}).passthrough(); // Allow extra fields GPT may return (rubric_score, required_elements_present, etc.)

const objectionSchema = z.object({
  objection: z.string(),
  category: z.string(),
  handling_score: z.number().min(0).max(100),
  used_aaa: z.boolean().default(false),
  feedback: z.string(),
});

const scoringResponseSchema = z.object({
  overall_score: z.number().min(0).max(100),
  scores: z.array(phaseScoreSchema),
  objections_detected: z.array(objectionSchema).default([]),
  summary: z.string(),
}).passthrough(); // Allow extra fields like banned_phrases_used, critical_issues

export type ScoringResponse = z.infer<typeof scoringResponseSchema>;
export type PhaseScore = z.infer<typeof phaseScoreSchema>;

export function parseScoringResponse(response: string): ScoringResponse | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    let jsonStr = jsonMatch ? jsonMatch[1] : response;

    // Try to find JSON object if no code block
    if (!jsonMatch) {
      const objectMatch = response.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }
    }

    // Parse JSON
    const parsed = JSON.parse(jsonStr);

    // Validate with Zod (safeParse for better error reporting)
    const result = scoringResponseSchema.safeParse(parsed);

    if (!result.success) {
      console.error('[parseScoringResponse] Zod validation failed:', JSON.stringify(result.error.issues, null, 2));
      console.error('[parseScoringResponse] Raw keys:', Object.keys(parsed));
      console.error('[parseScoringResponse] Scores count:', parsed?.scores?.length, 'phases:', parsed?.scores?.map((s: { phase: string }) => s.phase));
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('[parseScoringResponse] Failed to parse:', error);
    console.error('[parseScoringResponse] Response preview:', response.substring(0, 500));
    return null;
  }
}

export function calculateOverallScore(scores: PhaseScore[]): number {
  if (scores.length === 0) return 0;

  // Weight phases - Overview (Pain Cycle) is most important
  const weights: Record<string, number> = {
    opening: 0.10,
    clarify: 0.12,
    label: 0.08,
    overview: 0.20,  // Most important phase
    sell_vacation: 0.15,
    price_presentation: 0.15,
    explain: 0.10,
    reinforce: 0.10,
  };

  // Only sum weights for phases that were actually scored.
  // Excluded phases won't be in the scores array, so totalWeight
  // will be less than 1.0 — the division normalizes automatically.
  let weightedSum = 0;
  let totalWeight = 0;

  scores.forEach((score) => {
    const weight = weights[score.phase] || 1 / 8;
    weightedSum += score.score * weight;
    totalWeight += weight;
  });

  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

export function getScoreLevel(score: number): 'excellent' | 'good' | 'needs_work' | 'poor' {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'needs_work';
  return 'poor';
}

export function generateFallbackScores(excludedPhases: string[] = []): ScoringResponse {
  const scoredPhases = ALL_PHASES.filter(p => !excludedPhases.includes(p));
  return {
    overall_score: 0,
    scores: scoredPhases.map(phase => ({
      phase,
      score: 0,
      feedback: 'Unable to analyze',
      highlights: [],
      improvements: [],
      quotes: [],
    })),
    objections_detected: [],
    summary: 'Unable to analyze this call. Please try again or contact support.',
  };
}
