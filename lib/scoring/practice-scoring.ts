import OpenAI from 'openai';
import type { PracticeMessage, ScriptContent } from '@/types/database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface PracticePhaseScore {
  phase: string;
  score: number;
  feedback: string;
  highlights: string[];
  improvements: string[];
  you_said: string[];  // Actual quotes from what the rep said
  should_say: string[]; // What they should say instead
}

export interface PracticeScoreResult {
  overallScore: number;
  overallFeedback: string;
  phaseScores: PracticePhaseScore[];
  strengths: string[];
  improvements: string[];
}

/**
 * Score a practice session using the same CLOSER framework as real calls
 */
export async function scorePracticeSession(
  messages: PracticeMessage[],
  personaName: string,
  personaDescription: string,
  scriptContent: ScriptContent | null
): Promise<PracticeScoreResult> {
  // Convert messages to transcript format
  const transcript = messages
    .map((m) => `${m.role === 'rep' ? 'REP' : 'PROSPECT'}: ${m.content}`)
    .join('\n\n');

  const prompt = createPracticeScoringPrompt(personaName, personaDescription, scriptContent);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: `Score this practice conversation:\n\n${transcript}` },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content || '';

  try {
    const result = JSON.parse(content);
    return normalizeScoreResult(result);
  } catch {
    return getDefaultScoreResult();
  }
}

function createPracticeScoringPrompt(
  personaName: string,
  personaDescription: string,
  scriptContent: ScriptContent | null
): string {
  const bannedPhrases = scriptContent?.conviction_tonality?.banned_phrases ||
                        scriptContent?.banned_phrases || [];
  const closerPhases = scriptContent?.closer_phases || {};
  const courseDetails = scriptContent?.course_details;
  const pricing = scriptContent?.pricing;

  // Extract actual script lines for reference
  const getExactScript = (phase: string): string => {
    const phaseContent = closerPhases[phase as keyof typeof closerPhases];
    if (phaseContent?.exact_script && Array.isArray(phaseContent.exact_script)) {
      return phaseContent.exact_script.slice(0, 3).join('\n'); // First 3 lines
    }
    return '';
  };

  // Build actual script reference
  const scriptReference = scriptContent ? `
## ACTUAL SCRIPT CONTENT (Use ONLY these for "should_say" suggestions - do NOT make up different wording)

### Teacher & Course Info
${courseDetails?.teacher ? `- Teacher: ${courseDetails.teacher.name}
- Credentials: ${Array.isArray(courseDetails.teacher.credentials) ? courseDetails.teacher.credentials.join(', ') : 'Not specified'}` : 'Not specified'}

### Pricing
${pricing?.annual_premium ? `- Annual: $${pricing.annual_premium.price}` : ''}
${pricing?.monthly_premium ? `- Monthly: $${pricing.monthly_premium.price}` : ''}
${pricing?.trial ? `- Trial: $${pricing.trial.price}` : ''}

### Key Script Lines by Phase
${getExactScript('opening') ? `**Opening:** ${getExactScript('opening')}` : ''}
${getExactScript('clarify') ? `**Clarify:** ${getExactScript('clarify')}` : ''}
${getExactScript('label') ? `**Label:** ${getExactScript('label')}` : ''}
${getExactScript('overview') ? `**Overview:** ${getExactScript('overview')}` : ''}
${getExactScript('sell_vacation') ? `**Sell Vacation:** ${getExactScript('sell_vacation')}` : ''}
${getExactScript('explain') ? `**Explain:** ${getExactScript('explain')}` : ''}
${getExactScript('reinforce') ? `**Reinforce:** ${getExactScript('reinforce')}` : ''}
` : '';

  return `You are a STRICT sales coach scoring practice sessions against the Hormozi CLOSER framework for MyEdSpace.
${scriptReference}

## PRACTICE SESSION CONTEXT
The rep was practicing with: ${personaName}
Persona: ${personaDescription}

This is a practice session, so score based on technique even if the "prospect" (AI persona) responds differently than a real prospect might.

## CRITICAL SCORING RULES

1. **Be STRICT but fair** - Help reps improve by showing exactly where they deviated from best practices
2. **Score based on SPECIFIC requirements** - Each phase has required elements
3. **Use the 1-5 scale** - Map to percentages: 5=100%, 4=80%, 3=60%, 2=40%, 1=20%
4. **Focus on what the REP said** - The prospect is an AI, so focus on rep technique
5. **Quote specific evidence** - Show exactly what they said or didn't say

## PHASE SCORING CRITERIA

### Opening (Weight: 10%)
Required: Greeting, proof/credibility mention, promise of outcome, plan for call, micro-commitment
Red flags: "How are you today?", no agenda, launching into pitch

### Clarify (Weight: 15%)
Required: Ask why they reached out, get their problem in their words, understand situation, urgency trigger
Red flags: Assuming problem, closed questions only

### Label (Weight: 10%)
Required: Restate problem in their words, get confirmation, show understanding
Red flags: Moving on without confirmation

### Overview/Pain Cycle (Weight: 25%) - MOST IMPORTANT
Required: Explore past attempts, why they failed, emotional impact, cost of inaction
Red flags: Skipping pain exploration, moving to solution too quickly

### Sell the Vacation (Weight: 15%)
Required: Present solution as outcome, mention credentials/proof, paint success picture
Red flags: Feature-dumping, no social proof

### Explain/AAA Objections (Weight: 15%)
Required: Handle objections with AAA (Acknowledge, Associate, Ask), don't argue
Red flags: Arguing, dismissing concerns

### Reinforce/Close (Weight: 10%)
Required: Summarize value, present tiers clearly, create urgency, ask for commitment
Red flags: Weak close, no clear ask

${bannedPhrases.length > 0 ? `
## BANNED PHRASES (automatic deductions)
${bannedPhrases.map(p => `- "${p}"`).join('\n')}
` : ''}

## RESPONSE FORMAT

Return JSON with this exact structure. IMPORTANT: For each phase, include ACTUAL QUOTES from what the rep said in "you_said", and provide better alternatives in "should_say". This side-by-side comparison is critical for learning.

{
  "overall_score": <0-100 weighted average>,
  "overall_feedback": "<2-3 sentences summary>",
  "phase_scores": [
    {
      "phase": "opening",
      "score": <0-100>,
      "feedback": "<specific feedback>",
      "highlights": ["<what they did well>"],
      "improvements": ["<what to improve>"],
      "you_said": ["<EXACT quote from rep in this phase - copy their actual words>"],
      "should_say": ["<What they SHOULD have said instead - provide script example>"]
    },
    {
      "phase": "clarify",
      "score": <0-100>,
      "feedback": "<specific feedback>",
      "highlights": ["<what they did well>"],
      "improvements": ["<what to improve>"],
      "you_said": ["<EXACT quote from rep>"],
      "should_say": ["<Better alternative>"]
    },
    {
      "phase": "label",
      "score": <0-100>,
      "feedback": "<specific feedback>",
      "highlights": ["<what they did well>"],
      "improvements": ["<what to improve>"],
      "you_said": ["<EXACT quote from rep>"],
      "should_say": ["<Better alternative>"]
    },
    {
      "phase": "overview",
      "score": <0-100>,
      "feedback": "<specific feedback>",
      "highlights": ["<what they did well>"],
      "improvements": ["<what to improve>"],
      "you_said": ["<EXACT quote from rep - especially questions they asked or didn't ask>"],
      "should_say": ["<Questions they should have asked, e.g. 'What else have you tried?'>"]
    },
    {
      "phase": "sell_vacation",
      "score": <0-100>,
      "feedback": "<specific feedback>",
      "highlights": ["<what they did well>"],
      "improvements": ["<what to improve>"],
      "you_said": ["<EXACT quote from rep>"],
      "should_say": ["<Better alternative>"]
    },
    {
      "phase": "explain",
      "score": <0-100>,
      "feedback": "<specific feedback>",
      "highlights": ["<what they did well>"],
      "improvements": ["<what to improve>"],
      "you_said": ["<EXACT quote - especially how they handled objections>"],
      "should_say": ["<Better objection handling using AAA framework>"]
    },
    {
      "phase": "reinforce",
      "score": <0-100>,
      "feedback": "<specific feedback>",
      "highlights": ["<what they did well>"],
      "improvements": ["<what to improve>"],
      "you_said": ["<EXACT quote from rep>"],
      "should_say": ["<Better closing script>"]
    }
  ],
  "strengths": ["<top 2-3 overall strengths>"],
  "improvements": ["<top 2-3 priority improvements>"]
}

CRITICAL: Always populate "you_said" with ACTUAL quotes from the transcript. Never leave it empty. If the rep didn't say anything for a phase, note that. The comparison between "you_said" and "should_say" is the most valuable learning tool.

IMPORTANT: For "should_say" suggestions, ONLY use wording from the ACTUAL SCRIPT CONTENT provided above. Do NOT invent script lines or add details not in the script. Use the exact teacher name, credentials, and pricing from the script.`;
}

function normalizeScoreResult(result: Record<string, unknown>): PracticeScoreResult {
  const phaseScores = (result.phase_scores as Array<Record<string, unknown>> || []).map(ps => ({
    phase: String(ps.phase || ''),
    score: Number(ps.score || 0),
    feedback: String(ps.feedback || ''),
    highlights: Array.isArray(ps.highlights) ? ps.highlights.map(String) : [],
    improvements: Array.isArray(ps.improvements) ? ps.improvements.map(String) : [],
    you_said: Array.isArray(ps.you_said) ? ps.you_said.map(String) : [],
    should_say: Array.isArray(ps.should_say) ? ps.should_say.map(String) : [],
  }));

  return {
    overallScore: Number(result.overall_score || 0),
    overallFeedback: String(result.overall_feedback || 'Unable to generate feedback'),
    phaseScores,
    strengths: Array.isArray(result.strengths) ? result.strengths.map(String) : [],
    improvements: Array.isArray(result.improvements) ? result.improvements.map(String) : [],
  };
}

function getDefaultScoreResult(): PracticeScoreResult {
  return {
    overallScore: 0,
    overallFeedback: 'Unable to score session. Please try again.',
    phaseScores: [],
    strengths: [],
    improvements: [],
  };
}
