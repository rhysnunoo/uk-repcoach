/**
 * Centralized AI Prompt Library
 *
 * All AI prompts used throughout the application are consolidated here.
 * This makes it easier to:
 * - Review and update prompts
 * - Maintain consistency across features
 * - Test prompt variations
 * - Track prompt versions
 */

import type { ScriptContent, TranscriptSegment } from '@/types/database';

// Re-export existing prompt functions for backwards compatibility
export { createScoringSystemPrompt, createScoringUserPrompt } from '../scoring/prompt';
export { scorePracticeSession } from '../scoring/practice-scoring';

/**
 * Base instruction for all CLOSER framework scoring
 */
export const CLOSER_FRAMEWORK_INSTRUCTION = `
You are an expert sales coach specializing in the CLOSER sales framework.
The CLOSER framework phases are:
- C (Clarify): Understand the prospect's situation and needs
- L (Label): Identify and name the core problem
- O (Overview/Pain): Explore the pain points and their impact
- S (Sell Vacation): Present the solution as an outcome/destination
- E (Explain/Objections): Handle objections using the AAA method
- R (Reinforce/Close): Secure commitment and next steps

When scoring, focus on:
1. Script adherence - Did they follow the prescribed language?
2. Technique execution - Did they apply the techniques correctly?
3. Timing and flow - Was the conversation well-paced?
4. Objection handling - Did they use AAA (Acknowledge, Associate, Ask)?
5. Closing strength - Did they ask for the sale confidently?
`;

/**
 * Base instruction for practice sessions
 */
export const PRACTICE_SESSION_INSTRUCTION = `
You are a realistic prospect in a sales call simulation.
Your goal is to provide a challenging but fair practice experience.
React naturally to what the sales rep says - don't be scripted.
If they do something well, show increased interest.
If they make mistakes, become more skeptical.
Ask questions a real prospect would ask.
Present objections when appropriate.
`;

/**
 * JSON formatting instruction for API responses
 */
export const JSON_RESPONSE_INSTRUCTION = `
Respond ONLY with valid JSON. Do not include any explanation or markdown.
The response must be parseable by JSON.parse().
`;

/**
 * Score formatting instruction
 */
export const SCORE_FORMAT_INSTRUCTION = `
Score each phase from 0-100 where:
- 90-100: Excellent - exceeded expectations
- 70-89: Good - met expectations with minor issues
- 50-69: Needs improvement - significant gaps
- Below 50: Poor - major issues or missing entirely

Provide specific, actionable feedback for each score.
`;

/**
 * Helper to format transcript for prompts
 */
export function formatTranscriptForPrompt(transcript: TranscriptSegment[]): string {
  return transcript
    .map((seg) => `[${seg.speaker.toUpperCase()}]: ${seg.text}`)
    .join('\n');
}

/**
 * Helper to extract relevant script content for prompts
 */
export function extractScriptContent(
  scriptContent: ScriptContent | null | undefined,
  phase: string
): {
  exactScript: string;
  pricing: string;
  teacherInfo: string;
} {
  if (!scriptContent) {
    return { exactScript: '', pricing: '', teacherInfo: '' };
  }

  const closerPhases = scriptContent.closer_phases || {};
  const phaseContent = closerPhases[phase as keyof typeof closerPhases];

  let exactScript = '';
  if (phaseContent?.exact_script && Array.isArray(phaseContent.exact_script)) {
    exactScript = phaseContent.exact_script.join('\n');
  }

  // Get pricing info
  let pricing = '';
  if (scriptContent.pricing) {
    const p = scriptContent.pricing;
    pricing = `Annual: $${p.annual_price}/year, Monthly: $${p.monthly_price}/month`;
    if (p.discounts) {
      pricing += `, Discounts: ${p.discounts}`;
    }
  }

  // Get teacher info
  let teacherInfo = '';
  if (scriptContent.course_details) {
    const cd = scriptContent.course_details;
    teacherInfo = `Teacher: ${cd.teacher_name || 'Not specified'}`;
    if (cd.teacher_credentials) {
      teacherInfo += ` - ${cd.teacher_credentials}`;
    }
  }

  return { exactScript, pricing, teacherInfo };
}

/**
 * Common objection responses for practice
 */
export const COMMON_OBJECTIONS = {
  price: [
    "That's more than I was expecting to pay.",
    "I need to think about the budget.",
    "Is there a payment plan?",
  ],
  timing: [
    "We're really busy right now.",
    "Can we start next month instead?",
    "I need to check my schedule.",
  ],
  authority: [
    "I need to talk to my spouse first.",
    "My partner handles these decisions.",
    "Let me discuss with the family.",
  ],
  need: [
    "I'm not sure we really need this.",
    "We've managed okay so far.",
    "Is this really going to help?",
  ],
  trust: [
    "How do I know this will work?",
    "Do you have any guarantees?",
    "What if it doesn't help?",
  ],
};

/**
 * Prompt version tracking
 */
export const PROMPT_VERSIONS = {
  scoring: '2.0.0',
  practiceScoring: '2.0.0',
  personas: '1.0.0',
  scenarios: '1.0.0',
};
