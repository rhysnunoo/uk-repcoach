// Recommended phrases and coaching tips for each CLOSER phase (UK MyEdSpace)

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
      'Greet + confirm speaking with correct person',
      'Recording disclosure and consent',
      'Brief proof/credibility (21,000+ students across the UK)',
      'Promise outcome (understand, show how to help, see if good fit)',
      'Plan for the call (~10 minutes)',
      'Micro-commitment ("How does that sound?")',
    ],
    recommendedPhrases: [
      '"Hi there - am I speaking with [Parent]? Thanks so much for booking in a consultation with me."',
      '"Just to let you know, this call is recorded for training purposes. Is that okay?"',
      '"We\'ve helped over 21,000 students across the UK improve their grades and confidence."',
      '"On this call, I\'d love to understand what\'s going on with your child, show you how we might help, and see if it\'s a good fit. Should take about 10 minutes."',
      '"How does that sound?"',
    ],
    avoidPhrases: [
      '"How are you today?"',
      '"Did I catch you at a good time?"',
      'Launching into product features immediately',
      'Long company introduction',
      'Forgetting recording disclosure',
    ],
    coachingTip: 'Keep it under 60 seconds. The goal is to get permission to ask questions, not to sell. A strong opening sets the frame for the entire call. Don\'t forget the recording disclosure - it\'s required.',
    exampleScript: `"Hi there - am I speaking with Sarah? Thanks so much for booking in a consultation with me.

Just to let you know, this call is recorded for training purposes. Is that okay?

Brilliant. So just a quick background - we've helped over 21,000 students across the UK improve their grades and confidence. On this call, I'd love to understand what's going on with your child, show you how we might be able to help, and see if it's a good fit. Should only take about 10 minutes.

How does that sound?"`,
  },

  clarify: {
    phase: 'clarify',
    displayName: 'Clarify (C) + Kill Zombies',
    letter: 'C',
    description: 'Get child details, check siblings, confirm subjects, and handle decision-maker upfront',
    requiredElements: [
      'Get child\'s name',
      'Check for siblings (20% discount opportunity)',
      'Confirm year group',
      'Identify subjects of interest',
      'Kill zombies - check if spouse/partner needs to be involved',
      'Handle child buy-in if mentioned',
    ],
    recommendedPhrases: [
      '"So first things first - who\'s the lucky one we\'re helping today? What\'s your child\'s name?"',
      '"And do you have any other children who might benefit from some support too?"',
      '"What year is [Child] in?"',
      '"For [Year Group], we offer [Subjects]. Which of these are you interested in?"',
      '"Before I tell you more - is it only you that needs to hear this, or should we get someone else involved upfront?"',
    ],
    avoidPhrases: [
      'Yes/no questions only',
      'Assuming year group or subjects without asking',
      'Forgetting to check for siblings',
      'Not addressing the decision-maker question',
      'Talking more than the prospect',
    ],
    coachingTip: 'Listen 80%, talk 20%. Check for siblings early - it\'s a 20% discount opportunity. Kill zombies by asking about the decision-maker BEFORE you pitch. This avoids the "I need to talk to my partner" objection at the end.',
    exampleScript: `"So first things first - who's the lucky one we're helping today?"
[Listen - "My daughter Sophie"]
"Lovely! And do you have any other children who might benefit too?"
[Listen]
"What year is Sophie in?"
[Listen - "Year 10"]
"Perfect. For GCSE, we offer Maths, English, Biology, Chemistry, and Physics. Which of these are you interested in for Sophie?"
[Listen]
"Before I tell you more - other parents sometimes make the mistake of waiting until the end and then having to get their partner to hear everything again. Is it only you that needs to hear this, or should we get someone else involved upfront?"`,
  },

  label: {
    phase: 'label',
    displayName: 'Label (L) + Discovery',
    letter: 'L',
    description: 'Discover their situation, empathise, and confirm understanding',
    requiredElements: [
      'Ask what made them reach out (open-ended)',
      'Empathy check: repeat, acknowledge, associate ("We hear this a lot")',
      'Ask about success vision',
      'Uncover urgency trigger (why now?)',
      'Restate problem using THEIR exact words',
      'Include year group, subjects, challenge, AND goal',
      'Get verbal confirmation ("Is that right?")',
    ],
    recommendedPhrases: [
      '"So tell me, what\'s been going on with [Child]\'s education that made you reach out to us?"',
      '"We hear this a lot from parents - you\'re definitely not alone."',
      '"What would success look like for [Child] by the end of this school year?"',
      '"What made you reach out now, versus a few months ago?"',
      '"So let me make sure I\'ve got this right. [Child] is in [Year] taking [Subjects]. The main challenge is [their words]. And what you really want is [their goal]. Is that right?"',
    ],
    avoidPhrases: [
      'Skipping the label entirely',
      'Moving to solution without confirmation',
      'Using your words instead of theirs',
      'No empathy or acknowledgment',
      'Not waiting for confirmation',
    ],
    coachingTip: 'Use their EXACT words when restating the problem. This shows you listened and builds massive trust. Include the empathy check - "We hear this a lot" normalises their situation. Don\'t move on until you get a clear "yes".',
    exampleScript: `"So tell me, what's been going on with Sophie's education that made you reach out to us?"
[Listen - let them explain fully]
"I really appreciate you sharing that. We hear this a lot from parents - you're definitely not alone."
"What would success look like for Sophie by the end of this school year?"
[Listen]
"And what made you reach out now, versus a few months ago?"
[Listen]
"Okay, so let me make sure I've got this right. Sophie's in Year 10 taking GCSE Maths and Chemistry. The main challenge is she's lost confidence since starting GCSEs and her grades have dropped from 7s to 4s. What you really want is for her to get back on track and feel confident before mock exams. Is that right?"`,
  },

  overview: {
    phase: 'overview',
    displayName: 'Overview / Pain Cycle (O)',
    letter: 'O',
    description: 'Explore past attempts and build urgency through pain',
    requiredElements: [
      'Ask about ALL past attempts ("What have you tried so far?")',
      'Follow up with "How did that go?" for EACH attempt',
      'Exhaust with "What else?" until nothing left (2-3 times minimum)',
      'Summarise and confirm all attempts failed',
      'Ask about duration ("How long has this been going on?")',
      'Ask about consequences ("If things stay the way they are, what does that mean?")',
    ],
    recommendedPhrases: [
      '"Before reaching out to us, what have you tried so far to help [Child]?"',
      '"And how did that go?"',
      '"What else have you tried?"',
      '"Anything else?"',
      '"So you\'ve tried [X], [Y], and [Z], and none of it has quite worked. How long has this been going on?"',
      '"And if things stay the way they are - what does that mean for [Child] by exam time?"',
    ],
    avoidPhrases: [
      'Skipping to the pitch too quickly',
      'Only asking once about past attempts',
      'Not exploring why past attempts failed',
      'Avoiding the pain conversation',
    ],
    coachingTip: 'This is the MOST IMPORTANT phase. Prospects don\'t buy without pain. Keep asking "what else?" until they have nothing left. The more they talk about failed attempts, the more they\'ll value your solution. Let them verbalise the consequences.',
    exampleScript: `"Before reaching out to us, what have you tried so far to help Sophie?"
[Listen - e.g., "We got her a private tutor"]
"And how did that go?"
[Listen]
"What else have you tried?"
[Listen - e.g., "YouTube videos, BBC Bitesize"]
"How did that work out?"
[Listen]
"Anything else?"
[Listen]
"So you've tried a private tutor, YouTube, and BBC Bitesize, and none of it has quite worked. How long has this been going on?"
[Listen]
"And if things stay the way they are - what does that mean for Sophie by mock exams?"`,
  },

  sell_vacation: {
    phase: 'sell_vacation',
    displayName: 'Sell the Vacation (S)',
    letter: 'S',
    description: 'Paint the outcome picture, leading with teacher credentials',
    requiredElements: [
      'Lead with teacher credentials (top 1% in the country, combined 100+ years experience)',
      'Bridge from their SPECIFIC pain point',
      'Explain what the child\'s week looks like (2 live lessons, workbooks, practice with video solutions, recordings)',
      'Use relevant proof point (58% GCSE 7-9, 25 messages/lesson, 1,700+ Trustpilot reviews)',
      'Mention 14-day money-back guarantee',
      'Keep brief - under 3 minutes',
    ],
    recommendedPhrases: [
      '"Can I tell you a bit about how we might be able to help?"',
      '"Our teachers are in the top 1% in the country - combined 100+ years of teaching experience."',
      '"What students say makes them special is how they explain topics. They can take something confusing and just make it click."',
      '"[Child] gets 2 live lessons every week per subject. They follow along with a workbook we provide."',
      '"Every single practice problem has a video solution where the teacher walks through it step by step."',
      '"Every lesson is recorded. So if [Child] misses a class, they just watch the recording."',
      '"Last year, 58% of our GCSE students achieved grades 7-9 - more than double the national average."',
      '"We have a 14-day money-back guarantee."',
    ],
    avoidPhrases: [
      'Feature dumps without connecting to their pain',
      'Generic pitch not tailored to their situation',
      'Burying teacher credentials',
      'Talking for more than 3 minutes',
    ],
    coachingTip: 'Sell the OUTCOME, not the product. Connect everything back to their specific pain from the Overview phase. Teacher credentials should come first - they establish trust before you pitch anything. Use specific proof points that match their concern.',
    exampleScript: `"That's really helpful, thank you. Can I tell you a bit about how we might be able to help?

So let me tell you about who'll be teaching Sophie. Our teachers are in the top 1% in the country - combined 100+ years of teaching experience. For GCSE Maths, you get teachers like Neil Trivedi - 9+ years, 1st Class from UCL. What students say makes them special is how they explain topics - they take something confusing and just make it click.

Sophie gets 2 live lessons every week. She follows along with a workbook we provide, so she can focus on listening. The teacher teaches live - it's interactive. Students ask questions in chat, work through problems together.

And here's the key - every single practice problem has a video solution where the teacher walks through it step by step. So if Sophie gets stuck at 9pm doing homework, she's not actually stuck.

Last year, 58% of our GCSE students achieved grades 7-9 - more than double the national average. And we have a 14-day money-back guarantee.

How does all of that sound so far?"`,
  },

  price_presentation: {
    phase: 'price_presentation',
    displayName: 'Price Presentation (P)',
    letter: 'P',
    description: 'Present tiered pricing starting with highest value option',
    requiredElements: [
      'Check for buy-in BEFORE presenting price ("How does all of that sound?")',
      'Lead with Annual plan (£319+ depending on subjects) - highest value anchor',
      'Frame as investment vs tutor cost (£4-5/lesson vs £50/hr tutor)',
      'Have downsell tiers ready: Monthly (£80+) → Trial (£10)',
      'Mention payment plan (3 instalments) and 5% upfront discount',
      'Present one option at a time, wait for response',
    ],
    recommendedPhrases: [
      '"So - how does all of that sound so far?"',
      '"An average private tutor charges around £50 an hour. With us, you get our top 1% teachers for just £[price] for the full course. That works out to around £4-5 per lesson."',
      '"You can pay upfront and save an extra 5%, or split it into 3 monthly instalments."',
      '"The next class for [Child] is [Day]. Should I get [Child] set up so they can start this week?"',
    ],
    avoidPhrases: [
      'Leading with the £10 trial (undersells value)',
      'Apologising for the price',
      'Presenting all options at once',
      'Skipping the buy-in question',
      'Rushing through pricing',
    ],
    coachingTip: 'Always get buy-in BEFORE price. If they\'re not bought in on the solution, price will always feel too high. Lead with annual to anchor high. Only downsell if needed. Frame against tutor costs (£50/hr) to make the price feel small.',
    exampleScript: `"So - how does all of that sound so far?"
[Wait for positive response]

"Great! So let me walk you through the investment. An average private tutor charges around £50 an hour. Two lessons a week - that's hundreds per month.

With us, the full course is £319 for 1 subject for the year. That works out to around £4.31 per lesson. You can pay upfront and save an extra 5%, or split it into 3 monthly instalments of £106.33.

And remember - 14-day money-back guarantee.

The next Maths class for Sophie is Wednesday. Should I get her set up so she can start this week?"

[If hesitation, pause - don't immediately downsell]`,
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
      '"I completely understand..." (Acknowledge)',
      '"We hear this a lot from parents..." (Associate)',
      '"What would make this a yes for you?" (Ask)',
      '"If this was completely up to you, would you have any hesitation?"',
      '"If money wasn\'t a concern, would this be something you\'d want for [Child]?"',
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
"I completely understand. [Acknowledge]
We hear this a lot from parents. [Associate]
What would make this a yes for you?" [Ask]

Objection: "That's more than I expected"
"I completely understand - it's a real investment. [Acknowledge]
This works out to £4-5 per lesson versus £50 for a tutor. [Associate]
If you'd prefer flexibility, we have monthly at £80 per subject, cancel anytime. [Alternative]
What would work best for your family?" [Ask]

Objection: "I need to talk to my partner"
"Completely understand. [Acknowledge]
If this was completely up to you, would you have any hesitation? [Ask]
We have a 14-day money-back guarantee, so your partner can see it in action. [Associate]"`,
  },

  reinforce: {
    phase: 'reinforce',
    displayName: 'Reinforce + Close (R)',
    letter: 'R',
    description: 'Present tiered pricing and close the sale',
    requiredElements: [
      'Follow tiered close: Annual → Monthly → Trial',
      'Present Annual FIRST (don\'t lead with trial)',
      'Have downsell path ready',
      'Once they say yes, STOP TALKING',
      'Stay on line for payment confirmation',
      'Clear next steps (registration link, parent account, student account, first class)',
    ],
    recommendedPhrases: [
      '"Should I get [Child] set up so they can start this week?"',
      '"Or if you\'d prefer flexibility, we have monthly at £[80-180]/month - no lock-in, cancel anytime."',
      '"Tell you what - try it for 10 days, just £10. Full access. No auto-renewal. Fair?"',
      '"Great choice. I\'m sending you the registration link now. I\'m happy to stay on the line while you register."',
      '"Perfect, I can see that\'s gone through. [Child] is all set! Their first class is [Day] at [Time]."',
    ],
    avoidPhrases: [
      'Leading with the £10 trial',
      'Multiple competing CTAs',
      'Fake urgency ("This offer expires today")',
      'Talking after they say yes',
      'Not staying on line for payment',
    ],
    coachingTip: 'Always lead with annual - it anchors high and most committed parents will take it. Have your downsell ready but don\'t offer it unless needed. When they say yes, STOP SELLING and stay on the line while they register and pay. Confirm you can see the payment.',
    exampleScript: `"The full course is £319 for the year - that's about £4.31 per lesson versus £50 for a tutor. You can pay upfront for 5% off or split into 3 instalments.

The next class for Sophie is Wednesday at 5pm. Should I get her set up?"

[If price objection]
"Or if you'd prefer flexibility, monthly is £80 - no lock-in, cancel anytime."

[If still hesitating]
"Tell you what - try it for 10 days, just £10. Full access, no auto-renewal. Fair?"

[When they say YES]
"Great choice! I'm sending you the registration link now. I'm happy to stay on the line while you register - should only take a minute or two."

[After payment]
"Perfect, I can see that's gone through! Sophie is all set. You'll get an email to set up your parent account, then Sophie's student account. Her first class is Wednesday at 5pm."`,
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
