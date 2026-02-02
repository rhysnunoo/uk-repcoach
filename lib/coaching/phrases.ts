// Recommended phrases and coaching tips for each CLOSER phase

export interface PhaseCoaching {
  phase: string;
  displayName: string;
  letter: string;
  description: string;
  requiredElements: string[];
  recommendedPhrases: string[];
  avoidPhrases: string[];
  coachingTip: string;
  exampleScript: string;
}

export const CLOSER_COACHING: Record<string, PhaseCoaching> = {
  opening: {
    phase: 'opening',
    displayName: 'Opening (Proof-Promise-Plan)',
    letter: 'O',
    description: 'Set the agenda, establish credibility, and get a micro-commitment',
    requiredElements: [
      'Greet + thank them for booking',
      'Brief proof/credibility statement',
      'Promise outcome (understand, show how to help, see if it makes sense)',
      'Plan for the call (~10 minutes)',
      'Micro-commitment ("How does that sound?")',
    ],
    recommendedPhrases: [
      '"Hi [Name], this is [Rep] from MyEdSpace. Thanks so much for taking the time to book a call with us."',
      '"We\'ve helped thousands of parents across the country get their kids back on track with math."',
      '"What I\'d like to do is spend about 10 minutes to understand your situation, show you how we might be able to help, and then see if it makes sense to work together."',
      '"How does that sound?"',
    ],
    avoidPhrases: [
      '"How are you today?"',
      '"Did I catch you at a good time?"',
      'Launching into product features immediately',
      'Long company introduction',
    ],
    coachingTip: 'Keep it under 60 seconds. The goal is to get permission to ask questions, not to sell. A strong opening sets the frame for the entire call.',
    exampleScript: `"Hi Sarah, this is John from MyEdSpace. Thanks so much for booking time with me today.

We've helped thousands of parents across the country get their kids confident with math again.

What I'd like to do is spend about 10 minutes to understand what's going on with [Child's name], show you how we might be able to help, and then see if it makes sense to work together.

How does that sound?"`,
  },

  clarify: {
    phase: 'clarify',
    displayName: 'Clarify (C)',
    letter: 'C',
    description: 'Understand their situation using open-ended questions',
    requiredElements: [
      'Ask why they reached out (open-ended)',
      'Get them to state their problem in their OWN words',
      'Cover child\'s grade level and current course',
      'Ask about their goal/success criteria',
      'Uncover urgency trigger ("What made you reach out NOW?")',
    ],
    recommendedPhrases: [
      '"So tell me, what\'s going on with [Child] and math?"',
      '"What grade is [Child] in and what math class are they taking?"',
      '"What would success look like for you?"',
      '"What made you decide to reach out NOW vs. waiting until next semester?"',
      '"Help me understand more about that..."',
    ],
    avoidPhrases: [
      'Yes/no questions',
      'Assuming the problem without asking',
      'Talking more than the prospect',
      'Jumping to solutions before understanding',
    ],
    coachingTip: 'Listen 80%, talk 20%. Use "tell me more" and "help me understand" to go deeper. The goal is to have THEM articulate the problem, not you.',
    exampleScript: `"So tell me, what's going on with Emma and math?"
[Listen]
"What grade is she in and what class is she taking?"
[Listen]
"And what would success look like for you? If we fast forward 3 months and everything worked out perfectly, what does that look like?"
[Listen]
"That makes sense. What made you decide to reach out now versus waiting?"`,
  },

  label: {
    phase: 'label',
    displayName: 'Label (L)',
    letter: 'L',
    description: 'Restate their problem to confirm understanding',
    requiredElements: [
      'Restate problem using THEIR exact words',
      'Include grade, course, specific challenge, AND goal',
      'Get verbal confirmation ("Is that accurate?")',
      'Acknowledge their input',
    ],
    recommendedPhrases: [
      '"So let me make sure I understand..."',
      '"So what I\'m hearing is that [Child] is in [grade] taking [course], and the main challenge is [their words]. Your goal is [their goal]. Is that accurate?"',
      '"Did I get that right?"',
      '"Is there anything I missed?"',
    ],
    avoidPhrases: [
      'Skipping the label entirely',
      'Moving to solution without confirmation',
      'Parroting without synthesizing',
      'Using your words instead of theirs',
    ],
    coachingTip: 'Use their EXACT words when possible. This shows you listened and builds trust. Don\'t move on until you get a clear "yes" that you understand.',
    exampleScript: `"So let me make sure I understand. Emma is in 8th grade taking Pre-Algebra, and she's been struggling with fractions and word problems since last year. It's affecting her confidence and you're worried about her falling behind before high school. Your goal is to get her caught up and feeling confident again before the end of the semester. Is that accurate?"`,
  },

  overview: {
    phase: 'overview',
    displayName: 'Overview / Pain Cycle (O)',
    letter: 'O',
    description: 'Explore past attempts and build urgency through pain',
    requiredElements: [
      'Ask about ALL past attempts ("What have you done so far?")',
      'Follow up with "How did that go?" for EACH attempt',
      'Exhaust with "What else?" until nothing left (2-3 times minimum)',
      'Summarize and confirm all attempts failed',
      'Ask about duration ("How long has this been going on?")',
      'Ask about consequences ("If nothing changes, what happens?")',
    ],
    recommendedPhrases: [
      '"What have you tried so far to help [Child] with math?"',
      '"And how did that go?"',
      '"What else have you tried?"',
      '"Anything else?"',
      '"So you\'ve tried [X], [Y], and [Z], and none of them have really worked. Is that fair to say?"',
      '"How long has this been going on?"',
      '"If nothing changes over the next 6 months, what happens?"',
    ],
    avoidPhrases: [
      'Skipping to the pitch too quickly',
      'Only asking once about past attempts',
      'Not exploring why past attempts failed',
      'Avoiding the pain conversation',
    ],
    coachingTip: 'This is the MOST IMPORTANT phase. Prospects don\'t buy without pain. Keep asking "what else?" until they have nothing left. The more they talk about failed attempts, the more they\'ll value your solution.',
    exampleScript: `"Before I tell you about what we do, I'm curious - what have you tried so far to help Emma with math?"
[Listen - e.g., "We tried Khan Academy"]
"And how did that go?"
[Listen]
"What else have you tried?"
[Listen - e.g., "A tutor for a few months"]
"How did that work out?"
[Listen]
"Anything else?"
[Listen]
"So you've tried Khan Academy and a tutor, and neither really solved the problem. Is that fair to say?"
[Confirm]
"How long has this been going on?"
[Listen]
"If nothing changes over the next year, what happens? Where does Emma end up?"`,
  },

  sell_vacation: {
    phase: 'sell_vacation',
    displayName: 'Sell the Vacation (S)',
    letter: 'S',
    description: 'Paint the outcome picture, leading with Eddie\'s credentials',
    requiredElements: [
      'Lead with Eddie\'s credentials (UCLA Pure Math, perfect SAT, 9 years, screened 3000+)',
      'Bridge from their SPECIFIC pain point',
      'Paint outcome picture (confident kid, easier homework - NOT features)',
      'Use relevant proof point matched to their concern',
      'Keep brief - under 3 minutes',
    ],
    recommendedPhrases: [
      '"So here\'s what makes us different. MyEdSpace was founded by Eddie, who studied Pure Math at UCLA, got a perfect 800 on his SAT math section, and has been teaching kids math for over 9 years."',
      '"He\'s personally screened over 3,000 tutors to build our team..."',
      '"Based on what you told me about [specific challenge], here\'s what typically happens..."',
      '"Most parents tell us that within the first few weeks, they notice [Child] is less frustrated with homework..."',
      '"Imagine [Child] actually understanding the material and feeling confident raising their hand in class..."',
    ],
    avoidPhrases: [
      'Feature dumps (workbooks, practice problems, dashboard...)',
      'Generic pitch not tailored to their situation',
      'Burying Eddie\'s credentials',
      'Talking for more than 3 minutes',
    ],
    coachingTip: 'Sell the OUTCOME, not the product. Connect everything back to their specific pain from the Overview phase. Eddie\'s credentials should come first - they establish trust before you pitch anything.',
    exampleScript: `"Based on everything you've shared, let me tell you how we can help.

MyEdSpace was founded by Eddie, who studied Pure Math at UCLA and got a perfect 800 on his SAT math. He's been teaching kids for over 9 years and has personally screened over 3,000 tutors.

Given that Emma's struggling with fractions and word problems, here's what typically happens with students like her. Within the first few sessions, they start to see patterns they were missing before. Parents usually notice within a few weeks that homework time is less stressful - less tears, fewer arguments.

By the end of the semester, kids like Emma usually go from dreading math to actually feeling confident enough to raise their hand in class."`,
  },

  price_presentation: {
    phase: 'price_presentation',
    displayName: 'Price Presentation (P)',
    letter: 'P',
    description: 'Present tiered pricing starting with highest value option',
    requiredElements: [
      'Check for buy-in BEFORE presenting price ("Does this sound like it could help?")',
      'Lead with Annual plan ($539) - highest value anchor',
      'Frame as investment, not cost ($/month breakdown, $/lesson)',
      'Have downsell tiers ready: Monthly ($149) → Trial ($7)',
      'Present one option at a time, wait for response',
    ],
    recommendedPhrases: [
      '"Before I share pricing, based on what I\'ve explained - does this sound like something that could help [Child]?"',
      '"Most families who are serious about getting results go with our annual plan at $539. That comes out to less than $17 per lesson."',
      '"For the whole school year, that\'s unlimited sessions with Eddie and his team."',
      '"Would that work for your family?"',
      '"If you\'d prefer not to commit to the full year, we also have a monthly option at $149."',
    ],
    avoidPhrases: [
      'Leading with the $7 trial (undersells value)',
      'Apologizing for the price',
      'Presenting all options at once',
      'Skipping the buy-in question',
      'Rushing through pricing',
    ],
    coachingTip: 'Always get buy-in BEFORE price. If they\'re not bought in on the solution, price will always feel too high. Lead with annual to anchor high - committed parents will take it. Only downsell if needed.',
    exampleScript: `"Before I share the investment, I want to make sure this makes sense - based on what I've explained, does it sound like this could help Emma get back on track?"

[Wait for yes]

"Great! So most families who are serious about getting results go with our annual plan. It's $539 for the whole year - that's unlimited sessions with Eddie and his team, and it works out to less than $17 per lesson.

Would that work for your family?"

[If hesitation, pause and listen - don't immediately downsell]`,
  },

  explain: {
    phase: 'explain',
    displayName: 'Explain / AAA Objection Handling (E)',
    letter: 'E',
    description: 'Handle objections using the AAA framework',
    requiredElements: [
      'Check for buy-in before closing',
      'Use AAA framework: Acknowledge, Associate, Ask',
      'Respond to objections with questions, not answers',
      'Identify the obstacle type (money, time, spouse, skepticism)',
    ],
    recommendedPhrases: [
      '"Does this sound like something that could help [Child]?"',
      '"I totally understand..." (Acknowledge)',
      '"A lot of parents feel the same way initially..." (Associate)',
      '"Help me understand - is it the investment itself, or something else?" (Ask)',
      '"What would need to happen for this to make sense for you?"',
      '"If the money wasn\'t a concern, would this be something you\'d want to move forward with?"',
    ],
    avoidPhrases: [
      'Answering objections directly',
      'Getting defensive',
      '"Trust me, it works"',
      'Offering discounts immediately',
      'Over-explaining (desperation)',
    ],
    coachingTip: 'The person asking questions is closing. NEVER answer an objection directly - always respond with a question. Your job is to understand the REAL objection, which is often different from the stated one.',
    exampleScript: `Objection: "I need to think about it"
"I totally understand - this is an important decision. [Acknowledge]
A lot of parents feel the same way when they first hear about us. [Associate]
Help me understand - when you say you need to think about it, is it the investment itself, or is there something specific you're unsure about?" [Ask]

Objection: "It's too expensive"
"I hear you, and I appreciate you being honest about that. [Acknowledge]
Many parents we work with felt the same way initially. [Associate]
Can I ask - if the investment wasn't a concern, is this something you'd want Emma to have?" [Ask]`,
  },

  reinforce: {
    phase: 'reinforce',
    displayName: 'Reinforce + Close (R)',
    letter: 'R',
    description: 'Present tiered pricing and close the sale',
    requiredElements: [
      'Follow tiered close: Annual ($539) → Monthly ($149) → Trial ($7)',
      'Present Annual FIRST (don\'t lead with trial)',
      'Have downsell path ready',
      'Once they say yes, STOP TALKING',
      'Clear next steps after close',
    ],
    recommendedPhrases: [
      '"Most families who are serious about getting results go with our annual plan at $539. That comes out to less than $45 a month and you get unlimited sessions for the whole year."',
      '"Would that work for you, or would you prefer to start with our monthly option at $149?"',
      '"If you want to just try it out first, we also have a $7 trial week so [Child] can experience a few sessions."',
      '"Perfect! Let me get you set up. I\'ll need..."',
    ],
    avoidPhrases: [
      'Leading with the $7 trial',
      'Multiple competing CTAs',
      'Fake urgency ("This offer expires today")',
      'Talking after they say yes',
      'Apologizing for the price',
    ],
    coachingTip: 'Always lead with annual - it anchors high and most committed parents will take it. Have your downsell ready but don\'t offer it unless needed. When they say yes, STOP SELLING and move to next steps immediately.',
    exampleScript: `"Based on everything we discussed, I think Emma would really benefit from this.

Most families who are serious about getting results go with our annual plan. It's $539 for the whole year - that's unlimited sessions, comes out to less than $45 a month.

Would that work for you?"

[If hesitation]
"If you'd rather not commit to the full year upfront, we also have a monthly option at $149. You can cancel anytime."

[If still hesitating]
"Or if you just want Emma to try it first, we have a $7 trial week where she can do a few sessions and see if it's a good fit."

[When they say yes]
"Perfect! Let me get you set up right now. I just need your email address to create Emma's account..."`,
  },
};

export function getCoachingForPhase(phase: string): PhaseCoaching | null {
  return CLOSER_COACHING[phase] || null;
}

export function getCoachingTip(phase: string, score: number): string {
  const coaching = CLOSER_COACHING[phase];
  if (!coaching) return '';

  if (score < 40) {
    return `Critical: This phase needs significant work. ${coaching.coachingTip}`;
  } else if (score < 60) {
    return `Focus area: ${coaching.coachingTip}`;
  } else if (score < 80) {
    return `Good progress. Tip: ${coaching.coachingTip}`;
  }
  return `Great job on this phase!`;
}
