/**
 * Centralized AI Prompt Library (UK MyEdSpace)
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
You are an expert sales coach specialising in the CLOSER sales framework for MyEdSpace UK.
The CLOSER framework phases are:
- C (Clarify): Understand the prospect's situation - child's name, year group, subjects, check siblings, kill zombies (decision-maker check)
- L (Label): Identify and name the core problem, empathy check, confirm understanding
- O (Overview/Pain): Explore past attempts and their impact - exhaust all, ask consequences
- S (Sell Vacation): Present the solution with teacher credentials, proof points, and 14-day guarantee
- E (Explain/Objections): Handle objections using the AAA method (Acknowledge, Associate, Ask)
- R (Reinforce/Close): Tiered close (Annual → Monthly → Trial), stay on line for payment

When scoring, focus on:
1. Script adherence - Did they follow the prescribed language?
2. Technique execution - Did they apply the techniques correctly?
3. Timing and flow - Was the conversation well-paced?
4. Objection handling - Did they use AAA (Acknowledge, Associate, Ask)?
5. Closing strength - Did they follow the tiered close and stay on line?
`;

/**
 * Base instruction for practice sessions
 */
export const PRACTICE_SESSION_INSTRUCTION = `
You are a realistic prospect (parent) in a sales call simulation for MyEdSpace UK.
Your goal is to provide a challenging but fair practice experience.
React naturally to what the sales rep says - don't be scripted.
If they do something well, show increased interest.
If they make mistakes, become more skeptical.
Ask questions a real UK parent would ask.
Present objections when appropriate.
Use British English naturally.
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

  // Get pricing info (UK format)
  let pricing = '';
  if (scriptContent.pricing) {
    const p = scriptContent.pricing;
    if (p.annual_1_subject) {
      pricing = `1 Subject: £${p.annual_1_subject.price}/year, Monthly: £${p.monthly?.['1_subject'] || 80}/month`;
    } else if (p.annual_premium) {
      pricing = `Annual: £${p.annual_premium.price}/year, Monthly: £${p.monthly_premium?.price || 80}/month`;
    }
  }

  // Get teacher info (UK format - multiple teachers per subject)
  let teacherInfo = '';
  if (scriptContent.course_details) {
    const cd = scriptContent.course_details;
    if (cd.teachers) {
      const teachers = cd.teachers as Record<string, { name: string; credentials: string }>;
      teacherInfo = Object.entries(teachers)
        .map(([subject, info]) => `${subject}: ${info.name}`)
        .join(', ');
    } else if (cd.teacher) {
      teacherInfo = `Teacher: ${cd.teacher?.name || 'Not specified'}`;
      if (cd.teacher?.credentials) {
        teacherInfo += ` - ${cd.teacher.credentials.join(', ')}`;
      }
    }
  }

  return { exactScript, pricing, teacherInfo };
}

/**
 * Common objection responses for practice (UK)
 */
export const COMMON_OBJECTIONS = {
  price: [
    "That's more than I was expecting to pay.",
    "I need to think about the budget.",
    "Is there a payment plan or instalments?",
  ],
  timing: [
    "We're really busy right now.",
    "Can we start next half-term instead?",
    "I need to check the schedule.",
  ],
  authority: [
    "I need to speak to my partner first.",
    "My husband/wife handles these decisions.",
    "Let me discuss with the family.",
  ],
  need: [
    "I'm not sure we really need this.",
    "They've managed okay so far.",
    "Is this really going to help?",
  ],
  trust: [
    "How do I know this will work?",
    "Is there a guarantee?",
    "What if it doesn't help?",
  ],
};

/**
 * Prompt version tracking
 */
export const PROMPT_VERSIONS = {
  scoring: '3.0.0-uk',
  practiceScoring: '3.0.0-uk',
  personas: '2.0.0-uk',
  scenarios: '2.0.0-uk',
};
