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
    // Also check for string-type exact_script
    if (typeof phaseContent?.exact_script === 'string') {
      return phaseContent.exact_script;
    }
    return '';
  };

  // Build teacher info from the new UK format (multiple teachers per subject)
  const buildTeacherInfo = (): string => {
    const teachers = courseDetails.teachers;
    if (!teachers) {
      // Fallback to old single-teacher format
      if (courseDetails.teacher) {
        return `- Teacher: ${courseDetails.teacher.name}\n- Credentials: ${Array.isArray(courseDetails.teacher.credentials) ? courseDetails.teacher.credentials.join(', ') : 'Not specified'}`;
      }
      return 'Not specified in script';
    }
    // New UK format: teachers per subject
    return Object.entries(teachers as Record<string, { name: string; credentials: string }>)
      .map(([subject, info]) => `- ${subject}: ${info.name} (${info.credentials})`)
      .join('\n');
  };

  // Build pricing info for UK format
  const buildPricingInfo = (): string => {
    const lines: string[] = [];
    if (pricing.annual_1_subject) lines.push(`- 1 Subject Annual: £${pricing.annual_1_subject.price} (was £${pricing.annual_1_subject.original || ''}, ${pricing.annual_1_subject.payment_plan || ''})`);
    if (pricing.annual_2_subjects) lines.push(`- 2 Subjects Annual: £${pricing.annual_2_subjects.price}`);
    if (pricing.annual_ultimate) lines.push(`- Ultimate (3+) Annual: £${pricing.annual_ultimate.price}`);
    if (pricing.monthly) lines.push(`- Monthly: £${pricing.monthly['1_subject'] || pricing.monthly.price || '80'}/subject (no lock-in, cancel anytime)`);
    if (pricing.trial) lines.push(`- Trial: £${pricing.trial.price} for ${pricing.trial.duration}`);
    // Fallback to old US format
    if (pricing.annual_premium) lines.push(`- Annual: £${pricing.annual_premium.price} (${pricing.annual_premium.value_statement || ''})`);
    if (pricing.monthly_premium) lines.push(`- Monthly: £${pricing.monthly_premium.price} (${pricing.monthly_premium.value_statement || ''})`);
    if (lines.length === 0) return 'Not specified';
    return lines.join('\n');
  };

  // Build the actual script reference section
  const scriptReference = `
## ACTUAL SCRIPT CONTENT (Use this as the reference - do NOT make up different wording)

### Course & Teacher Info
${buildTeacherInfo()}
${courseDetails.name ? `- Course: ${courseDetails.name}` : ''}
${courseDetails.schedule_note ? `- Schedule: ${courseDetails.schedule_note}` : ''}
${courseDetails.exam_year_bonus ? `- Exam Year Bonus: ${courseDetails.exam_year_bonus}` : ''}

### Pricing (from script)
${buildPricingInfo()}
${pricing.upfront_discount ? `- Upfront discount: ${pricing.upfront_discount}` : ''}
${pricing.sibling_discount ? `- Sibling discount: ${pricing.sibling_discount}` : ''}

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
${getExactScript('reinforce') || getExactScript('reinforce_close') || 'Not specified'}
`;

  return `You are a STRICT sales coach scoring calls against the Hormozi CLOSER framework for MyEdSpace UK.

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
- Greet + confirm speaking with correct person
- Recording disclosure and consent
- Brief proof/credibility ("21,000+ students across the UK")
- Promise outcome (understand situation, show how to help, see if good fit)
- Plan for the call (~10 minutes)
- Micro-commitment ("How does that sound?")

**Red Flags (automatic deductions):**
- "How are you today?" opener = Score 1 (CRITICAL)
- Launching into product pitch immediately = Score 1-2
- No agenda setting = Score 2-3
- Long company introduction = Score 2-3
- Forgetting recording disclosure = Score 3-4

**Scoring:**
- 5 (100%): All required elements, recording disclosed, under 60 sec, gets micro-commitment
- 4 (80%): Has most elements but missing one (e.g., no micro-commitment or no recording disclosure)
- 3 (60%): Has agenda but missing proof OR promise
- 2 (40%): Long company intro, no clear agenda
- 1 (20%): "How are you today?" opener, launches into pitch, no agenda

### Clarify (C) + Kill Zombies
**Required Elements:**
- Get child's name
- Check for siblings (discount opportunity)
- Confirm year group
- Identify subjects of interest
- Kill zombies - check if spouse/partner needs to be involved
- Handle child buy-in if mentioned

**Red Flags:**
- Assuming year group or subjects without asking
- Only yes/no questions
- Forgetting to check for siblings
- Not addressing decision-maker question
- Rep talks more than prospect

**Scoring:**
- 5 (100%): Gets name, year group, subjects, checks siblings, kills zombies, uses open-ended questions
- 4 (80%): Good discovery but misses one element (e.g., no zombie kill or sibling check)
- 3 (60%): Some discovery but relies on closed yes/no questions
- 2 (40%): Minimal discovery, moves quickly to pitch
- 1 (20%): Assumes details without asking, talks more than listens

### Label (L) + Discovery
**Required Elements:**
- Ask what made them reach out (open-ended)
- Empathy check: repeat, acknowledge, associate ("We hear this a lot from parents")
- Ask about success vision
- Uncover urgency trigger (why now?)
- Restate problem using THEIR exact words
- Include year group, subjects, specific challenge, AND goal
- Get verbal confirmation ("Is that right?")

**Red Flags:**
- Skipping labeling entirely
- Moving to solution without confirmation
- Parroting without synthesis
- Not using their words
- No empathy or acknowledgment
- Not waiting for confirmation

**Scoring:**
- 5 (100%): Full discovery, empathy check, restates using their words, includes all details, gets verbal confirmation
- 4 (80%): Good summary but missed empathy or confirmation was weak
- 3 (60%): Acknowledges but doesn't get explicit confirmation
- 2 (40%): Parrots their words without synthesis
- 1 (20%): Skips labeling entirely, moves straight to pitch

### Overview / Pain Cycle (O) - **MOST IMPORTANT PHASE**
${closerPhases.overview?.importance ? `**IMPORTANCE: ${closerPhases.overview.importance}**` : '**CRITICAL: Prospects don\'t buy without pain. This phase is weighted heavily.**'}

**Required Elements (ALL MUST BE PRESENT FOR HIGH SCORE):**
1. Ask about ALL past attempts ("What have you tried so far to help [Child]?")
2. Follow up with "How did that go?" for EACH attempt mentioned
3. Exhaust with "What else?" until nothing left (must ask at least 2-3 times)
4. Summarize and confirm all attempts failed
5. Ask about duration ("How long has this been going on?")
6. Ask about consequences if nothing changes ("If things stay the way they are, what does that mean for [Child] by exam time?")

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
- Lead with teacher credentials (top 1% in the country, combined 100+ years, specific teacher names and qualifications)
- Bridge from their SPECIFIC pain point (not generic pitch)
- Explain what the child's week looks like (2 live lessons, workbooks, practice problems with video solutions, recordings)
- Use relevant proof point matched to their concern (58% GCSE 7-9, 25 messages/lesson, 1,700+ Trustpilot reviews)
- Mention 14-day money-back guarantee
- Keep brief - under 3 minutes

**Red Flags:**
- Generic pitch not tailored to their situation
- Features before benefits
- Teacher credentials buried or mentioned as afterthought
- No specific numbers or proof
- Monologues over 3 minutes

**Scoring:**
- 5 (100%): Leads with teacher credentials, bridges from their specific pain, explains week structure, uses relevant proof, mentions guarantee, under 3 min
- 4 (80%): Good pitch but teacher credentials buried or generic proof point
- 3 (60%): Mentions teachers but generic pitch not tailored to their situation
- 2 (40%): Feature dump, no connection to their pain
- 1 (20%): No mention of teacher quality, no proof points, robotic feature list

### Price Presentation (P)
**Required Elements:**
- Check for buy-in BEFORE presenting price ("How does all of that sound so far?")
- Lead with Annual plan (£319+ depending on subjects) - highest value anchor
- Frame as investment vs tutor cost (£4-5/lesson vs £50/hr tutor)
- Present one tier at a time, wait for response
- Have downsell tiers ready: Monthly (£80+) → Trial (£10)
- Mention payment plan option (3 instalments)
- Stay on line for payment confirmation

**Red Flags:**
- Presenting price without getting buy-in first = Score 2-3
- Leading with £10 trial = Score 1-2 (undersells value)
- Apologising for the price
- Presenting all options at once (overwhelming)
- Rushing through pricing

**Scoring:**
- 5 (100%): Gets buy-in first, leads with Annual, frames value well, stays on line for payment, waits for response
- 4 (80%): Good presentation but missed buy-in question OR rushed slightly
- 3 (60%): Presents pricing but skipped buy-in or led with monthly
- 2 (40%): Presents all tiers at once, no value framing, or apologetic about price
- 1 (20%): Leads with £10 trial, no buy-in check, or skips pricing entirely

### Explain / AAA Objection Handling (E)
**Required Elements:**
- Use AAA framework for objections:
  - Acknowledge: Repeat concern neutrally
  - Associate: Connect to success story or similar parents
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
- Send registration link and stay on line for payment
- Clear next steps (first class date, parent account setup, student account setup)
- End with excitement about getting started

**Red Flags:**
- Keeps talking/selling after they say yes
- No clear next steps
- Not staying on line for payment confirmation
- Multiple competing CTAs
- High-pressure tactics or fake urgency

**Scoring:**
- 5 (100%): Stops selling after yes, stays on line for payment, smooth transition to next steps, clear logistics, positive send-off
- 4 (80%): Good close but slightly awkward transition or missed one next step
- 3 (60%): Gets the sale but fumbles next steps or keeps selling
- 2 (40%): Weak close, unclear next steps, keeps pitching after agreement
- 1 (20%): No close attempt, loses the sale after they were ready, or high-pressure tactics

## BANNED PHRASES (Deduct points if used)
${Array.isArray(bannedPhrases) && bannedPhrases.length > 0 ? bannedPhrases.join(', ') : 'Personalised learning, Maths can be fun!, World-class, Unlock potential, Learning journey, Empower, SUPER excited!, AMAZING!, How are you today?'}

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
When suggesting what the rep "should have said", ONLY use the exact wording from the ACTUAL SCRIPT CONTENT section above. Do NOT invent or make up script lines. If the script mentions specific teachers with specific credentials, use those exact details - do not add or change information unless it's in the actual script.`;
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
- If they didn't ask about consequences ("If things stay the way they are, what happens?"), deduct from Overview
- If they led with the £10 trial instead of Annual, Reinforce score cannot be above 40%
- If they used "How are you today?" opener, Opening score = 20%
- If they forgot recording disclosure, deduct from Opening
- Be specific about what's MISSING, not just what's there

**CRITICAL - USE ACTUAL SCRIPT ONLY:**
When providing "improvements" (what they should have said), ONLY use the exact wording from the ACTUAL SCRIPT CONTENT provided in the system prompt. Do NOT invent script lines or add details not in the script. Use the exact teacher names and credentials from the script.

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
