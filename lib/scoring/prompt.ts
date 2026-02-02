import type { ScriptContent, TranscriptSegment } from '@/types/database';

export function createScoringSystemPrompt(scriptContent: ScriptContent): string {
  const closerPhases = scriptContent.closer_phases || {};
  const bannedPhrases = scriptContent.conviction_tonality?.banned_phrases ||
                        scriptContent.banned_phrases || [];
  const courseDetails = scriptContent.course_details || {};
  const pricing = scriptContent.pricing || {};

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
${courseDetails.schedule ? `- Schedule: ${courseDetails.schedule.days} at ${courseDetails.schedule.pacific_time} PT / ${courseDetails.schedule.eastern_time} ET` : ''}

### Pricing (from script)
${pricing.annual_premium ? `- Annual: $${pricing.annual_premium.price} (${pricing.annual_premium.framing || pricing.annual_premium.value_statement || ''})` : ''}
${pricing.monthly_premium ? `- Monthly: $${pricing.monthly_premium.price} (${pricing.monthly_premium.framing || pricing.monthly_premium.value_statement || ''})` : ''}
${pricing.trial ? `- Trial: $${pricing.trial.price} for ${pricing.trial.duration} (${pricing.trial.framing || pricing.trial.value_statement || ''})` : ''}

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

  return `You are a STRICT sales coach scoring calls against the Hormozi CLOSER framework for MyEdSpace.

${scriptReference}

## CRITICAL SCORING RULES

1. **Be STRICT** - The goal is to help reps improve by showing them exactly where they deviated from the script
2. **Score based on SPECIFIC requirements** - Each phase has required elements. Missing ANY required element drops the score significantly
3. **Use the 1-5 scale** - Map to percentages: 5=100%, 4=80%, 3=60%, 2=40%, 1=20%
4. **If they didn't do something, score it LOW** - Don't give benefit of the doubt
5. **Quote specific evidence** - Show exactly what they said or DIDN'T say

## PHASE SCORING CRITERIA

### Opening (Proof-Promise-Plan)
**Required Elements:**
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
- 1 (20%): "How are you today?" opener, launches into pitch, no agenda

### Clarify (C)
**Required Elements:**
- Ask why they reached out (open-ended question)
- Get them to state their problem in their OWN words
- Cover child's grade level and current course
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
- 1 (20%): Assumes problem without asking, talks more than listens

### Label (L)
**Required Elements:**
- Restate problem using THEIR exact words
- Include grade, course, specific challenge, AND goal
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
- 1 (20%): Skips labeling entirely, moves straight to pitch

### Overview / Pain Cycle (O) - **MOST IMPORTANT PHASE**
${closerPhases.overview?.importance ? `**IMPORTANCE: ${closerPhases.overview.importance}**` : '**CRITICAL: Prospects don\'t buy without pain. This phase is weighted heavily.**'}

**Required Elements (ALL MUST BE PRESENT FOR HIGH SCORE):**
1. Ask about ALL past attempts ("What have you done so far to help [Child] with math?")
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

**STRICT CHECK:** If rep did NOT ask "What else have you tried?" multiple times AND did NOT ask about consequences, score CANNOT be above 3.

### Sell the Vacation (S)
**Required Elements:**
- Lead with Eddie's credentials (UCLA Pure Math, perfect SAT, 9 years, screened 3000+)
- Bridge from their SPECIFIC pain point (not generic pitch)
- Paint outcome picture (confident kid, easier homework - NOT features)
- Use relevant proof point matched to their concern
- Keep brief - under 3 minutes

**Red Flags:**
- Generic pitch not tailored to their situation
- Features before benefits (workbooks, practice problems... first)
- Eddie buried in details or mentioned as afterthought
- No specific numbers or proof
- Monologues over 3 minutes

**Scoring:**
- 5 (100%): Leads with Eddie credentials, bridges from their specific pain, paints outcomes (not features), uses relevant proof point, under 3 min
- 4 (80%): Good pitch but Eddie buried or generic proof point
- 3 (60%): Mentions Eddie but generic pitch not tailored to their situation
- 2 (40%): Feature dump, no connection to their pain
- 1 (20%): No mention of Eddie, no proof points, robotic feature list

### Price Presentation (P)
**Required Elements:**
- Check for buy-in BEFORE presenting price ("Does this sound like it could help?")
- Lead with Annual plan ($539) - highest value anchor
- Frame as investment, not cost (breakdown per month, per lesson)
- Present one tier at a time, wait for response
- Have downsell tiers ready: Monthly ($149) → Trial ($7)

**Red Flags:**
- Presenting price without getting buy-in first = Score 2-3
- Leading with $7 trial = Score 1-2 (undersells value)
- Apologizing for the price
- Presenting all options at once (overwhelming)
- Rushing through pricing

**Scoring:**
- 5 (100%): Gets buy-in first, leads with Annual, frames value well, waits for response
- 4 (80%): Good presentation but missed buy-in question OR rushed slightly
- 3 (60%): Presents pricing but skipped buy-in or led with monthly
- 2 (40%): Presents all tiers at once, no value framing, or apologetic about price
- 1 (20%): Leads with $7 trial, no buy-in check, or skips pricing entirely

### Explain / AAA Objection Handling (E)
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

**Note:** If NO objections were raised (prospect was fully bought in), score this phase based on whether the rep checked for concerns or moved smoothly to close. A call with no objections can still score 80-100% here.

### Reinforce + Close (R)
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
- 1 (20%): No close attempt, loses the sale after they were ready, or high-pressure tactics

## BANNED PHRASES (Deduct points if used)
${Array.isArray(bannedPhrases) && bannedPhrases.length > 0 ? bannedPhrases.join(', ') : 'Personalized learning, Math can be fun!, World-class, Unlock potential, Learning journey, Empower, SUPER excited!, AMAZING!, How are you today?'}

## OVERALL SCORING
- Weight Overview (Pain Cycle) at 25% - it's the most critical
- If Overview scores 1-2, flag as CRITICAL issue regardless of other scores
- Map 1-5 scores to percentages for consistency

## YOUR TASK
Score each phase STRICTLY against these criteria. For each phase:
1. Give a 1-5 score based on the rubric above (then convert to percentage)
2. List which required elements were PRESENT
3. List which required elements were MISSING
4. Quote specific evidence from the transcript
5. Be specific about what they should have said - **USE THE ACTUAL SCRIPT CONTENT PROVIDED ABOVE, do NOT make up different wording**

## CRITICAL: Use Actual Script Content
When suggesting what the rep "should have said", ONLY use the exact wording from the ACTUAL SCRIPT CONTENT section above. Do NOT invent or make up script lines. If the script says the teacher is "Eddie Kang" with specific credentials, use those exact credentials - do not add or change details like "founded MyEdSpace" unless it's in the actual script.`;
}

export function createScoringUserPrompt(transcript: TranscriptSegment[]): string {
  const formattedTranscript = transcript
    .map((segment) => {
      const speaker = segment.speaker === 'rep' ? 'REP' : 'PROSPECT';
      const time = formatTime(segment.start_time);
      return `[${time}] ${speaker}: ${segment.text}`;
    })
    .join('\n');

  return `Score this sales call transcript STRICTLY against the CLOSER framework.

## Transcript

${formattedTranscript}

## Required Response Format

Respond with a JSON object. Be STRICT - if they didn't do something, score it low.

\`\`\`json
{
  "overall_score": <weighted average, number 0-100>,
  "scores": [
    {
      "phase": "opening",
      "score": <number 0-100, based on 1-5 rubric: 5=100, 4=80, 3=60, 2=40, 1=20>,
      "rubric_score": <1-5 based on exact criteria>,
      "feedback": "<specific feedback referencing what they DID and DIDN'T do>",
      "required_elements_present": ["<elements they hit>"],
      "required_elements_missing": ["<elements they missed>"],
      "highlights": ["<what was done well>"],
      "improvements": ["<specific things they should have said>"],
      "quotes": [{"text": "<REQUIRED: exact quote showing how they opened>", "sentiment": "positive|negative|neutral", "timestamp": 0}]
    },
    {
      "phase": "clarify",
      "score": <number>,
      "rubric_score": <1-5>,
      "feedback": "<feedback>",
      "required_elements_present": [],
      "required_elements_missing": [],
      "highlights": [],
      "improvements": [],
      "quotes": [{"text": "<REQUIRED: quote showing their discovery questions or lack thereof>", "sentiment": "positive|negative|neutral", "timestamp": 0}]
    },
    {
      "phase": "label",
      "score": <number>,
      "rubric_score": <1-5>,
      "feedback": "<feedback>",
      "required_elements_present": [],
      "required_elements_missing": [],
      "highlights": [],
      "improvements": [],
      "quotes": [{"text": "<REQUIRED: quote showing their label/summary attempt>", "sentiment": "positive|negative|neutral", "timestamp": 0}]
    },
    {
      "phase": "overview",
      "score": <number - BE STRICT ON THIS PHASE>,
      "rubric_score": <1-5>,
      "feedback": "<DETAILED feedback - this is the most important phase>",
      "required_elements_present": [],
      "required_elements_missing": [],
      "highlights": [],
      "improvements": ["<specific questions they should have asked>"],
      "quotes": [{"text": "<REQUIRED: quote showing their pain exploration or lack thereof>", "sentiment": "positive|negative|neutral", "timestamp": 0}]
    },
    {
      "phase": "sell_vacation",
      "score": <number>,
      "rubric_score": <1-5>,
      "feedback": "<feedback>",
      "required_elements_present": [],
      "required_elements_missing": [],
      "highlights": [],
      "improvements": [],
      "quotes": [{"text": "<REQUIRED: quote showing their pitch/presentation>", "sentiment": "positive|negative|neutral", "timestamp": 0}]
    },
    {
      "phase": "price_presentation",
      "score": <number>,
      "rubric_score": <1-5>,
      "feedback": "<feedback on how they presented pricing>",
      "required_elements_present": [],
      "required_elements_missing": [],
      "highlights": [],
      "improvements": [],
      "quotes": [{"text": "<REQUIRED: quote showing how they presented price or buy-in question>", "sentiment": "positive|negative|neutral", "timestamp": 0}]
    },
    {
      "phase": "explain",
      "score": <number>,
      "rubric_score": <1-5>,
      "feedback": "<feedback on objection handling - if no objections raised, note that>",
      "required_elements_present": [],
      "required_elements_missing": [],
      "highlights": [],
      "improvements": [],
      "quotes": [{"text": "<REQUIRED: quote showing their objection response, or their check for concerns>", "sentiment": "positive|negative|neutral", "timestamp": 0}]
    },
    {
      "phase": "reinforce",
      "score": <number>,
      "rubric_score": <1-5>,
      "feedback": "<feedback on closing and next steps AFTER agreement>",
      "required_elements_present": [],
      "required_elements_missing": [],
      "highlights": [],
      "improvements": [],
      "quotes": [{"text": "<REQUIRED: quote showing their close or next steps>", "sentiment": "positive|negative|neutral", "timestamp": 0}]
    }
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
  "critical_issues": ["<if Overview scored 1-2, flag here>", "<other critical issues>"],
  "summary": "<2-3 sentence summary focusing on the BIGGEST gaps and what to fix>"
}
\`\`\`

**IMPORTANT SCORING REMINDERS:**
- If they didn't ask "What else have you tried?" multiple times in Overview, score cannot be above 60%
- If they didn't ask about consequences ("If nothing changes, what happens?"), deduct from Overview
- If they led with the $7 trial instead of Annual, Reinforce score cannot be above 40%
- If they used "How are you today?" opener, Opening score = 20%
- Be specific about what's MISSING, not just what's there

**CRITICAL - USE ACTUAL SCRIPT ONLY:**
When providing "improvements" (what they should have said), ONLY use the exact wording from the ACTUAL SCRIPT CONTENT provided in the system prompt. Do NOT invent script lines or add details not in the script. For example, if the script says Eddie has "UCLA Pure Math degree", do NOT say he "founded MyEdSpace" unless that's explicitly in the script.

**CRITICAL - QUOTES REQUIREMENT (DO NOT SKIP):**
For EVERY single phase, you MUST include 1-2 quotes in the "quotes" array. This is MANDATORY - the UI displays "You Said" vs "Script Says" for each phase, and it breaks if quotes are missing.

For each phase:
1. Find 1-2 specific things the rep said during that phase
2. Copy their EXACT words from the transcript
3. Mark as "negative" if it's something to improve, "positive" if done well
4. Include the timestamp from the transcript

If the rep skipped a phase entirely, include a quote from where they SHOULD have done that phase but didn't, and mark it "negative".

IMPORTANT: Empty quotes arrays are NOT acceptable. Every phase MUST have at least one quote.`;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
