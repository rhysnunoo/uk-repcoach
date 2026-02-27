import type { ScriptContent, TranscriptSegment, CallContext } from '@/types/database';

/**
 * Defines which phases are excluded for each call context,
 * and any adapted criteria for phases that remain but change.
 */
const CONTEXT_CONFIG: Record<CallContext, {
  excludedPhases: string[];
  adaptedCriteria: Record<string, string>;
  contextDescription: string;
}> = {
  new_lead: {
    excludedPhases: [],
    adaptedCriteria: {},
    contextDescription: 'This is a FIRST CONTACT with a brand new lead. The rep has no prior information about this person. Score all phases fully against the standard CLOSER framework.',
  },
  booked_call: {
    excludedPhases: [],
    adaptedCriteria: {
      clarify: `**ADAPTED FOR BOOKED CALL:** The prospect booked this call themselves and may have provided some info (year group, etc.) on the form. Do NOT penalise the rep for not asking questions whose answers were already provided at booking (e.g. year group, subjects). DO still expect them to dig deeper — ask WHY they booked, what's driving urgency, what success looks like. Score based on whether they deepened understanding beyond what was already known.`,
    },
    contextDescription: 'This is a BOOKED CALL — the prospect actively booked a call and may have provided basic info (year group, subject). The rep should still do thorough discovery but won\'t need to ask for info that was already given.',
  },
  warm_lead: {
    excludedPhases: ['clarify', 'label', 'overview'],
    adaptedCriteria: {
      opening: `**ADAPTED FOR WARM LEAD:** The rep has been in active conversation with this prospect (e.g. messaging, WhatsApp, email). Do NOT score on proof/credibility elements — the prospect already knows who we are. Instead score on: (1) Referencing the prior conversation naturally, (2) Setting a clear agenda for THIS call, (3) Getting a micro-commitment to proceed. Red flag: treating it like a cold call and re-introducing the company from scratch.`,
      sell_vacation: `**ADAPTED FOR WARM LEAD:** Since Clarify/Label/Overview are excluded, the rep should naturally weave in references to the prospect's known situation when pitching. Score on whether the pitch connects to the specific pain/context they already know about from prior conversations.`,
    },
    contextDescription: 'This is a WARM LEAD — the rep has already been in conversation with this prospect (messaging, WhatsApp, email, etc.) and already knows their situation, pain points, and context. Phases that would re-discover known information are EXCLUDED. The focus should be on pitching, pricing, objection handling, and closing.',
  },
  follow_up: {
    excludedPhases: ['clarify', 'label', 'overview'],
    adaptedCriteria: {
      opening: `**ADAPTED FOR FOLLOW-UP:** This is a return call — the rep has spoken to this prospect before. Do NOT score on proof/credibility. Instead score on: (1) Recapping the previous conversation ("Last time we spoke about X..."), (2) Acknowledging where they left off, (3) Setting a clear agenda for THIS call ("Today I wanted to..."), (4) Getting a micro-commitment. Red flag: starting from scratch as if they've never spoken.`,
      sell_vacation: `**ADAPTED FOR FOLLOW-UP:** Should be a shorter, targeted recap — not a full pitch from scratch. Score on whether the rep efficiently reconnected the prospect to the value proposition and addressed any specific concerns from last time.`,
    },
    contextDescription: 'This is a FOLLOW-UP call — the rep has already spoken to this prospect before and is returning to continue the conversation or close. Discovery and pain exploration from previous calls should NOT be repeated. The focus should be on recapping, addressing outstanding concerns, and closing.',
  },
};

export function getExcludedPhases(callContext: CallContext): string[] {
  return CONTEXT_CONFIG[callContext].excludedPhases;
}

export function createScoringSystemPrompt(scriptContent: ScriptContent, callContext: CallContext = 'new_lead'): string {
  const closerPhases = scriptContent.closer_phases || {};
  const bannedPhrases = scriptContent.conviction_tonality?.banned_phrases ||
                        scriptContent.banned_phrases || [];
  const courseDetails = scriptContent.course_details || {};
  const pricing = scriptContent.pricing || {};
  const config = CONTEXT_CONFIG[callContext];

  // Extract actual script lines for each phase
  const getExactScript = (phase: string): string => {
    const phaseContent = closerPhases[phase as keyof typeof closerPhases];
    if (phaseContent?.exact_script && Array.isArray(phaseContent.exact_script)) {
      return phaseContent.exact_script.join('\n');
    }
    return '';
  };

  // Build the actual script reference section
  const scriptReference = `
## ACTUAL SCRIPT CONTENT (Use this as the reference - do NOT make up different wording)

### Course & Teacher Info
${courseDetails.teacher ? `- Teacher: ${courseDetails.teacher.name}
- Credentials: ${Array.isArray(courseDetails.teacher.credentials) ? courseDetails.teacher.credentials.join(', ') : 'Not specified'}` : 'Not specified in script'}
${courseDetails.name ? `- Course: ${courseDetails.name}` : ''}
${courseDetails.schedule ? `- Schedule: ${courseDetails.schedule.days} at ${courseDetails.schedule.time || ''}` : ''}

### Pricing (from script)
${pricing.annual_premium ? `- Annual: £${pricing.annual_premium.price} (${pricing.annual_premium.framing || pricing.annual_premium.value_statement || ''})` : ''}
${pricing.monthly_premium ? `- Monthly: £${pricing.monthly_premium.price} (${pricing.monthly_premium.framing || pricing.monthly_premium.value_statement || ''})` : ''}
${pricing.trial ? `- Trial: £${pricing.trial.price} for ${pricing.trial.duration} (${pricing.trial.framing || pricing.trial.value_statement || ''})` : ''}

### Opening Script
${getExactScript('opening') || 'Not specified'}

### Clarify Script
${getExactScript('clarify') || 'Not specified'}

### Label Script
${getExactScript('label') || 'Not specified'}

### Overview/Pain Cycle Script
${getExactScript('overview') || 'Not specified'}

### Sell the Vacation Script
${getExactScript('sell_vacation') || 'Not specified'}

### Explain (Objection Handling) Script
${getExactScript('explain') || 'Not specified'}

### Reinforce/Close Script
${getExactScript('reinforce') || 'Not specified'}
`;

  // Build context-aware phase criteria
  const phaseCriteria = buildPhaseCriteria(closerPhases, config);

  // Build exclusion notice
  const exclusionNotice = config.excludedPhases.length > 0
    ? `\n## EXCLUDED PHASES (DO NOT SCORE THESE)\nThe following phases are EXCLUDED for this call type and should NOT appear in your scores array:\n${config.excludedPhases.map(p => `- **${p}**`).join('\n')}\n\nOnly score the phases listed in PHASE SCORING CRITERIA below. If the rep happens to do elements from excluded phases (e.g. naturally referencing pain they already know), that's fine — note it positively in other phase feedback, but do NOT create a separate score for excluded phases.\n`
    : '';

  return `You are a STRICT sales coach scoring calls against the Hormozi CLOSER framework for MyEdSpace.

## CALL CONTEXT
${config.contextDescription}

${scriptReference}

## CRITICAL SCORING RULES

1. **Be STRICT** - The goal is to help reps improve by showing them exactly where they deviated from the script
2. **Score based on SPECIFIC requirements** - Each phase has required elements. Missing ANY required element drops the score significantly
3. **Use the 1-5 scale** - Map to percentages: 5=100%, 4=80%, 3=60%, 2=40%, 1=20%
4. **If they didn't do something, score it LOW** - Don't give benefit of the doubt
5. **Quote specific evidence** - Show exactly what they said or DIDN'T say
${exclusionNotice}
## PHASE SCORING CRITERIA

${phaseCriteria}

## BANNED PHRASES (Deduct points if used)
${Array.isArray(bannedPhrases) && bannedPhrases.length > 0 ? bannedPhrases.join(', ') : 'Personalised learning, Maths can be fun!, World-class, Unlock potential, Learning journey, Empower, SUPER excited!, AMAZING!, How are you today?'}

## OVERALL SCORING
- Only score the phases listed above (excluded phases are not counted)
- The overall score is the weighted average of scored phases only
${callContext === 'new_lead' || callContext === 'booked_call' ? '- Weight Overview (Pain Cycle) at 25% - it\'s the most critical\n- If Overview scores 1-2, flag as CRITICAL issue regardless of other scores' : '- Weight Price Presentation and Reinforce more heavily — closing is the main goal for this call type'}
- Map 1-5 scores to percentages for consistency

## YOUR TASK
Score each INCLUDED phase STRICTLY against these criteria. For each phase:
1. Give a 1-5 score based on the rubric above (then convert to percentage)
2. List which required elements were PRESENT
3. List which required elements were MISSING
4. Quote specific evidence from the transcript
5. Be specific about what they should have said - **USE THE ACTUAL SCRIPT CONTENT PROVIDED ABOVE, do NOT make up different wording**

## CRITICAL: Use Actual Script Content
When suggesting what the rep "should have said", ONLY use the exact wording from the ACTUAL SCRIPT CONTENT section above. Do NOT invent or make up script lines. If the script describes the teachers with specific credentials, use those exact credentials - do not add or change details unless they are in the actual script.`;
}

function buildPhaseCriteria(
  closerPhases: ScriptContent['closer_phases'],
  config: { excludedPhases: string[]; adaptedCriteria: Record<string, string> }
): string {
  const phases: Array<{ key: string; criteria: string }> = [];

  // Opening
  if (!config.excludedPhases.includes('opening')) {
    const adapted = config.adaptedCriteria.opening || '';
    phases.push({
      key: 'opening',
      criteria: `### Opening (Proof-Promise-Plan)
${adapted ? adapted + '\n' : ''}**Required Elements:**
- Greet + thank them for booking
- Brief proof/credibility ("thousands of parents")
- Promise outcome (understand situation, show how to help, see if it makes sense)
- Plan for the call (~10 minutes)
- Micro-commitment ("How does that sound?")

**Red Flags (automatic deductions):**
- "How are you today?" opener = Score 1 (CRITICAL)
- Launching into product pitch immediately = Score 1-2
- No agenda setting = Score 2-3
- Long company introduction = Score 2-3

**Scoring:**
- 5 (100%): All required elements, under 60 sec, gets micro-commitment
- 4 (80%): Has most elements but missing one (e.g., no micro-commitment)
- 3 (60%): Has agenda but missing proof OR promise
- 2 (40%): Long company intro, no clear agenda
- 1 (20%): "How are you today?" opener, launches into pitch, no agenda`,
    });
  }

  // Clarify
  if (!config.excludedPhases.includes('clarify')) {
    const adapted = config.adaptedCriteria.clarify || '';
    phases.push({
      key: 'clarify',
      criteria: `### Clarify (C)
${adapted ? adapted + '\n' : ''}**Required Elements:**
- Ask why they reached out (open-ended question)
- Get them to state their problem in their OWN words
- Cover child's year group and subjects
- Ask about their goal/success criteria
- Uncover urgency trigger ("What made you reach out NOW?")

**Red Flags:**
- Assuming problem without asking
- Only yes/no questions
- Rep talks more than prospect
- Not uncovering the "why now"

**Scoring:**
- 5 (100%): All elements present, uses open-ended questions, listens more than talks
- 4 (80%): Good discovery but misses one element (e.g., no urgency question)
- 3 (60%): Some discovery but relies on closed yes/no questions
- 2 (40%): Minimal discovery, moves quickly to pitch
- 1 (20%): Assumes problem without asking, talks more than listens`,
    });
  }

  // Label
  if (!config.excludedPhases.includes('label')) {
    phases.push({
      key: 'label',
      criteria: `### Label (L)
**Required Elements:**
- Restate problem using THEIR exact words
- Include year group, subjects, specific challenge, AND goal
- Get verbal confirmation ("Is that accurate?" / "Is that right?")
- Acknowledge their input

**Red Flags:**
- Skipping labeling entirely
- Moving to solution without confirmation
- Parroting without synthesis
- Not waiting for confirmation

**Scoring:**
- 5 (100%): Restates using their words, includes all details, gets verbal confirmation
- 4 (80%): Good summary but confirmation was weak
- 3 (60%): Acknowledges but doesn't get explicit confirmation
- 2 (40%): Parrots their words without synthesis
- 1 (20%): Skips labeling entirely, moves straight to pitch`,
    });
  }

  // Overview
  if (!config.excludedPhases.includes('overview')) {
    phases.push({
      key: 'overview',
      criteria: `### Overview / Pain Cycle (O) - **MOST IMPORTANT PHASE**
${closerPhases?.overview?.importance ? `**IMPORTANCE: ${closerPhases.overview.importance}**` : '**CRITICAL: Prospects don\'t buy without pain. This phase is weighted heavily.**'}

**Required Elements (ALL MUST BE PRESENT FOR HIGH SCORE):**
1. Ask about ALL past attempts ("What have you done so far to help [Child] with maths?")
2. Follow up with "How did that go?" for EACH attempt mentioned
3. Exhaust with "What else?" until nothing left (must ask at least 2-3 times)
4. Summarize and confirm all attempts failed
5. Ask about duration ("How long has this been going on?")
6. Ask about consequences if nothing changes ("If nothing changes, what happens?")

**Red Flags:**
- Skipping pain cycle entirely = Score 1 (CRITICAL FAILURE)
- Not exploring past failures in depth
- Only asking once about past attempts
- Moving to pitch before exhausting pain
- No empathy or acknowledgment

**Scoring:**
- 5 (100%): Asks about past attempts, follows up "how did that go?" for each, exhausts with "what else?" multiple times, summarizes all failed attempts, asks about duration, asks about consequences
- 4 (80%): Good pain cycle but didn't fully exhaust OR missed consequences question
- 3 (60%): Asks about past attempts but doesn't go deep, moves on after 1-2 attempts
- 2 (40%): Minimal exploration, token question about past attempts
- 1 (20%): Skips pain cycle entirely, goes straight to pitch (CRITICAL FAILURE)

**STRICT CHECK:** If rep did NOT ask "What else have you tried?" multiple times AND did NOT ask about consequences, score CANNOT be above 3.`,
    });
  }

  // Sell the Vacation
  if (!config.excludedPhases.includes('sell_vacation')) {
    const adapted = config.adaptedCriteria.sell_vacation || '';
    phases.push({
      key: 'sell_vacation',
      criteria: `### Sell the Vacation (S)
${adapted ? adapted + '\n' : ''}**Required Elements:**
- Lead with teacher credentials (top 1%, Oxford/Cambridge/UCL/Imperial/Warwick, combined 100+ years)
- Bridge from their SPECIFIC pain point (not generic pitch)
- Paint outcome picture (confident kid, easier homework - NOT features)
- Use relevant proof point matched to their concern
- Keep brief - under 3 minutes

**Red Flags:**
- Generic pitch not tailored to their situation
- Features before benefits (workbooks, practice problems... first)
- Teacher credentials buried in details or mentioned as afterthought
- No specific numbers or proof
- Monologues over 3 minutes

**Scoring:**
- 5 (100%): Leads with teacher credentials, bridges from their specific pain, paints outcomes (not features), uses relevant proof point, under 3 min
- 4 (80%): Good pitch but teacher credentials buried or generic proof point
- 3 (60%): Mentions our teachers but generic pitch not tailored to their situation
- 2 (40%): Feature dump, no connection to their pain
- 1 (20%): No mention of the teachers, no proof points, robotic feature list`,
    });
  }

  // Price Presentation
  if (!config.excludedPhases.includes('price_presentation')) {
    phases.push({
      key: 'price_presentation',
      criteria: `### Price Presentation (P)
**Required Elements:**
- Check for buy-in BEFORE presenting price ("Does this sound like it could help?")
- Lead with Annual plan (£319+) - highest value anchor
- Frame as investment, not cost (around £4-5 per hour)
- Present one tier at a time, wait for response
- Have downsell tiers ready: Monthly (£80+) → Trial (£10)

**Red Flags:**
- Presenting price without getting buy-in first = Score 2-3
- Leading with £10 trial = Score 1-2 (undersells value)
- Apologizing for the price
- Presenting all options at once (overwhelming)
- Rushing through pricing

**Scoring:**
- 5 (100%): Gets buy-in first, leads with Annual, frames value well, waits for response
- 4 (80%): Good presentation but missed buy-in question OR rushed slightly
- 3 (60%): Presents pricing but skipped buy-in or led with monthly
- 2 (40%): Presents all tiers at once, no value framing, or apologetic about price
- 1 (20%): Leads with £10 trial, no buy-in check, or skips pricing entirely`,
    });
  }

  // Explain
  if (!config.excludedPhases.includes('explain')) {
    phases.push({
      key: 'explain',
      criteria: `### Explain / AAA Objection Handling (E)
**Required Elements:**
- Use AAA framework for objections:
  - Acknowledge: Repeat concern neutrally
  - Associate: Connect to success story
  - Ask: Return with a question (never answer directly)
- Respond to objections with questions, not answers
- Identify the obstacle type (money, time, spouse, skepticism)

**Key Principle:** The person asking questions is closing. Never answer an objection directly.

**Red Flags:**
- Answering objections directly (loses control)
- Getting defensive or arguing
- Generic "trust us" responses
- No objection handling at all
- Over-explaining (desperation)
- Offering discounts to close

**Scoring:**
- 5 (100%): Uses AAA on all objections, responds with questions, identifies obstacle type
- 4 (80%): Uses AAA mostly but answered one objection directly
- 3 (60%): Handles some objections but answers directly rather than with questions
- 2 (40%): Gets flustered by objections, defensive responses
- 1 (20%): No objection handling, argues with prospect, or avoids objections

**Note:** If NO objections were raised (prospect was fully bought in), score this phase based on whether the rep checked for concerns or moved smoothly to close. A call with no objections can still score 80-100% here.`,
    });
  }

  // Reinforce
  if (!config.excludedPhases.includes('reinforce')) {
    phases.push({
      key: 'reinforce',
      criteria: `### Reinforce + Close (R)
**Required Elements:**
- Once they agree, STOP SELLING immediately
- Confirm the decision positively
- Clear next steps (collect payment info, set up account, schedule first session)
- Create urgency around getting started (first session date)
- End with excitement about the journey

**Red Flags:**
- Keeps talking/selling after they say yes
- No clear next steps
- Fumbling the close logistics
- Multiple competing CTAs
- High-pressure tactics or fake urgency

**Scoring:**
- 5 (100%): Stops selling after yes, smooth transition to next steps, clear logistics, positive send-off
- 4 (80%): Good close but slightly awkward transition or missed one next step
- 3 (60%): Gets the sale but fumbles next steps or keeps selling
- 2 (40%): Weak close, unclear next steps, keeps pitching after agreement
- 1 (20%): No close attempt, loses the sale after they were ready, or high-pressure tactics`,
    });
  }

  return phases.map(p => p.criteria).join('\n\n');
}

export function createScoringUserPrompt(transcript: TranscriptSegment[], callContext: CallContext = 'new_lead'): string {
  const formattedTranscript = transcript
    .map((segment) => {
      const speaker = segment.speaker === 'rep' ? 'REP' : 'PROSPECT';
      const time = formatTime(segment.start_time);
      return `[${time}] ${speaker}: ${segment.text}`;
    })
    .join('\n');

  const config = CONTEXT_CONFIG[callContext];
  const scoredPhases = ['opening', 'clarify', 'label', 'overview', 'sell_vacation', 'price_presentation', 'explain', 'reinforce']
    .filter(p => !config.excludedPhases.includes(p));

  // Build the JSON template with only scored phases
  const phaseTemplates = scoredPhases.map(phase => {
    const phaseHints: Record<string, string> = {
      opening: 'exact quote showing how they opened',
      clarify: 'quote showing their discovery questions or lack thereof',
      label: 'quote showing their label/summary attempt',
      overview: 'quote showing their pain exploration or lack thereof',
      sell_vacation: 'quote showing their pitch/presentation',
      price_presentation: 'quote showing how they presented price or buy-in question',
      explain: 'quote showing their objection response, or their check for concerns',
      reinforce: 'quote showing their close or next steps',
    };
    const strictNote = phase === 'overview' ? ' - BE STRICT ON THIS PHASE' : '';
    const detailedNote = phase === 'overview' ? 'DETAILED feedback - this is the most important phase' : 'feedback';
    return `    {
      "phase": "${phase}",
      "score": <number 0-100${strictNote}>,
      "rubric_score": <1-5 based on exact criteria>,
      "feedback": "<${detailedNote}>",
      "required_elements_present": ["<elements they hit>"],
      "required_elements_missing": ["<elements they missed>"],
      "highlights": ["<what was done well>"],
      "improvements": ["<specific things they should have said>"],
      "quotes": [{"text": "<REQUIRED: ${phaseHints[phase] || 'relevant quote'}>", "sentiment": "positive|negative|neutral", "timestamp": 0}]
    }`;
  });

  const contextLabel = {
    new_lead: 'NEW LEAD (first contact)',
    booked_call: 'BOOKED CALL (prospect booked this call)',
    warm_lead: 'WARM LEAD (already been messaging)',
    follow_up: 'FOLLOW-UP (returning call)',
  }[callContext];

  return `Score this sales call transcript STRICTLY against the CLOSER framework.

## Call Context: ${contextLabel}
${config.excludedPhases.length > 0 ? `\n**EXCLUDED PHASES (do NOT score):** ${config.excludedPhases.join(', ')}\nOnly include scores for the phases listed in the JSON template below.\n` : ''}
## Transcript

${formattedTranscript}

## Required Response Format

Respond with a JSON object. Be STRICT - if they didn't do something, score it low.
${config.excludedPhases.length > 0 ? `\n**IMPORTANT:** Only include the ${scoredPhases.length} phases shown below. Do NOT include scores for excluded phases (${config.excludedPhases.join(', ')}).\n` : ''}
\`\`\`json
{
  "overall_score": <weighted average of scored phases only, number 0-100>,
  "scores": [
${phaseTemplates.join(',\n')}
  ],
  "objections_detected": [
    {
      "objection": "<the objection raised>",
      "category": "price | timing | spouse | skepticism | other",
      "handling_score": <0-100>,
      "used_aaa": <true/false>,
      "feedback": "<how it was handled, did they use AAA or answer directly?>"
    }
  ],
  "banned_phrases_used": ["<any banned phrases detected>"],
  "critical_issues": ["<any critical issues>"],
  "summary": "<2-3 sentence summary focusing on the BIGGEST gaps and what to fix>"
}
\`\`\`

**IMPORTANT SCORING REMINDERS:**
${callContext === 'new_lead' || callContext === 'booked_call' ? `- If they didn't ask "What else have you tried?" multiple times in Overview, score cannot be above 60%
- If they didn't ask about consequences ("If nothing changes, what happens?"), deduct from Overview` : '- Discovery phases are excluded for this call type — do NOT penalise for missing discovery'}
- If they led with the £10 trial instead of Annual, Price Presentation score cannot be above 40%
- If they used "How are you today?" opener, Opening score = 20%
- Be specific about what's MISSING, not just what's there

**CRITICAL - USE ACTUAL SCRIPT ONLY:**
When providing "improvements" (what they should have said), ONLY use the exact wording from the ACTUAL SCRIPT CONTENT provided in the system prompt. Do NOT invent script lines or add details not in the script. For example, if the script describes teacher credentials, use those exact credentials - do NOT add or change details unless they are explicitly in the script.

**CRITICAL - QUOTES REQUIREMENT (DO NOT SKIP):**
For EVERY single scored phase, you MUST include 1-2 quotes in the "quotes" array. This is MANDATORY - the UI displays "You Said" vs "Script Says" for each phase, and it breaks if quotes are missing.

For each phase:
1. Find 1-2 specific things the rep said during that phase
2. Copy their EXACT words from the transcript
3. Mark as "negative" if it's something to improve, "positive" if done well
4. Include the timestamp from the transcript

If the rep skipped a phase entirely, include a quote from where they SHOULD have done that phase but didn't, and mark it "negative".

IMPORTANT: Empty quotes arrays are NOT acceptable. Every scored phase MUST have at least one quote.`;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
