import type { PersonaType } from '@/types/database';

export interface Scenario {
  id: string;
  name: string;
  description: string;
  contextModifier: string; // Added to persona's system prompt
  urgencyLevel: 'low' | 'medium' | 'high';
  difficultyModifier: number; // -0.2 to +0.2 adjustment to objection likelihood
}

// Scenarios available for all personas
export const universalScenarios: Scenario[] = [
  {
    id: 'standard',
    name: 'Standard Call',
    description: 'A typical inbound call - they booked through the website.',
    contextModifier: 'You booked a consultation through the MyEdSpace website after seeing an ad on Facebook.',
    urgencyLevel: 'medium',
    difficultyModifier: 0,
  },
  {
    id: 'referral',
    name: 'Friend Referral',
    description: 'Referred by a friend whose child is in the programme.',
    contextModifier: `You were referred by your friend whose child has been with MyEdSpace for 3 months and loves it. You're more open but still have your own concerns. If asked, share that your friend's child has improved significantly and the Trustpilot reviews convinced you to book a call.`,
    urgencyLevel: 'medium',
    difficultyModifier: -0.1,
  },
  {
    id: 'test_coming',
    name: 'Exam in 2 Weeks',
    description: 'Child has an important exam or test coming up soon.',
    contextModifier: `Your child has a major test in 2 weeks and you're worried they'll fail. You need help NOW. Express urgency about timing and ask if they can actually help before the test. Time pressure is real - you might need to look elsewhere if they can't help quickly.`,
    urgencyLevel: 'high',
    difficultyModifier: -0.05,
  },
  {
    id: 'just_researching',
    name: 'Just Researching',
    description: 'Early in the research phase, no immediate urgency.',
    contextModifier: `You're just starting to research options. You've booked calls with several companies this week. You're gathering information and won't make a decision today. Push back on any urgency tactics. You have time - the school year just started.`,
    urgencyLevel: 'low',
    difficultyModifier: 0.15,
  },
  {
    id: 'comparison_shopping',
    name: 'Comparing Options',
    description: 'Just got off a call with a competitor.',
    contextModifier: `You just finished looking at Kumon and a local tutoring centre before this call. You're comparing options and have their pricing fresh in mind. Ask how MyEdSpace compares. Mention specific things the competitor offered. Be willing to share what you liked/didn't like about the other option if asked.`,
    urgencyLevel: 'medium',
    difficultyModifier: 0.1,
  },
  {
    id: 'spouse_listening',
    name: 'Partner on Speaker',
    description: 'Partner is listening in on the call.',
    contextModifier: `Your partner is sitting next to you listening to this call (but not speaking). You'll occasionally pause to look at them for reaction. You can't fully commit without their agreement. Mention early that your partner is listening. If they have objections, voice them as "my partner is wondering..."`,
    urgencyLevel: 'medium',
    difficultyModifier: 0.1,
  },
];

// Persona-specific scenarios
export const personaScenarios: Record<PersonaType, Scenario[]> = {
  skeptical_parent: [
    {
      id: 'burned_twice',
      name: 'Burned Multiple Times',
      description: 'Has tried 3+ different tutoring solutions that all failed.',
      contextModifier: `You've tried Kumon (18 months, no results - just boring worksheets), a private tutor (£40/hour for 6 months, minor improvement), and BBC Bitesize and YouTube (your child never stuck with it). You're running out of patience AND money. You need to understand exactly why this would be different. Ask very specific questions about teacher qualifications and evidence.`,
      urgencyLevel: 'medium',
      difficultyModifier: 0.2,
    },
    {
      id: 'teacher_recommended',
      name: 'Teacher Recommended Help',
      description: "Child's teacher said they need intervention.",
      contextModifier: `Your child's teacher called you in for a parents' evening meeting and said your child is falling behind and needs intervention. You're slightly more open because a professional recommended help, but you're also stressed and defensive about your child's abilities. The teacher specifically mentioned needing help with the current topic.`,
      urgencyLevel: 'high',
      difficultyModifier: -0.1,
    },
  ],
  price_sensitive: [
    {
      id: 'single_income',
      name: 'Single Income Household',
      description: 'One parent recently lost their job.',
      contextModifier: `Your partner was made redundant 2 months ago and you're on a single income. Money is extremely tight but you're desperate to help your child not fall behind during this stressful time. You need the absolute lowest option possible. Ask about payment plans, instalments, or any hardship support.`,
      urgencyLevel: 'high',
      difficultyModifier: 0.15,
    },
    {
      id: 'tax_credits',
      name: 'Expecting Extra Money',
      description: 'Expecting a tax rebate or bonus in a few weeks.',
      contextModifier: `You're expecting a work bonus in about 3 weeks. You could afford the annual plan with that money but nothing sooner. You're interested in locking something in now but paying later. Ask about delayed payment options or if they can hold a spot. The £10 trial might bridge the gap.`,
      urgencyLevel: 'medium',
      difficultyModifier: -0.05,
    },
  ],
  engaged_ready: [
    {
      id: 'mock_exams',
      name: 'Mock Exams in 6 Weeks',
      description: 'Child has GCSE mock exams coming up and needs immediate help.',
      contextModifier: `GCSE mock exams are in exactly 6 weeks. You've done your research and you're ready to sign up TODAY. You just need confirmation on a few things: can they start immediately, will it help before mocks, and is there anything specific for GCSE revision? Don't waste time with small talk - you're busy. If the rep is efficient, you'll close quickly. You're interested in the Easter Revision Course or Cram Course if available.`,
      urgencyLevel: 'high',
      difficultyModifier: -0.15,
    },
    {
      id: 'returning_interest',
      name: 'Called Before',
      description: 'Called 2 months ago but decided to wait.',
      contextModifier: `You called MyEdSpace 2 months ago but decided to "wait and see" if your child improved on their own. They didn't. Now you're more ready. You remember some of what you learned last time. You don't need the full pitch again - just remind you of the key points and let's get started.`,
      urgencyLevel: 'high',
      difficultyModifier: -0.1,
    },
  ],
  spouse_blocker: [
    {
      id: 'spouse_against_online',
      name: 'Partner Hates Online Learning',
      description: 'Partner believes only in-person tutoring works, especially after COVID.',
      contextModifier: `Your partner is completely against online learning - they blame COVID screen time for their child falling behind. They want in-person help only. You need STRONG evidence that online can work. Ask about engagement metrics, how kids stay focused, the "no camera" policy, and success stories specifically about students who thrived online.`,
      urgencyLevel: 'medium',
      difficultyModifier: 0.15,
    },
    {
      id: 'spouse_wants_free',
      name: 'Partner Wants Free Options',
      description: "Partner thinks they should use free BBC Bitesize / Khan Academy.",
      contextModifier: `Your partner thinks you should just use BBC Bitesize or Khan Academy. "Why pay when there's free stuff?" You've tried to explain it's not working but they won't listen. You need ammunition to convince them why paid live teaching is worth it. What makes this different from free resources?`,
      urgencyLevel: 'medium',
      difficultyModifier: 0.1,
    },
  ],
  math_hater: [
    {
      id: 'same_struggles',
      name: 'Seeing Yourself',
      description: "Watching your child relive your exact struggles.",
      contextModifier: `You're watching your child struggle with the EXACT same things you struggled with at their age. It's bringing back painful memories of feeling stupid in maths lessons. You're emotional about it. You desperately want them to have a different experience than you did. Respond well to empathy and stories of transformation.`,
      urgencyLevel: 'medium',
      difficultyModifier: -0.05,
    },
    {
      id: 'crying_over_homework',
      name: 'Tears Over Homework',
      description: 'Child cries during homework every night.',
      contextModifier: `Your child cries almost every night during maths homework. It's breaking your heart. Homework time has become a battle that affects the whole family. You can't help because you don't understand the maths yourself. You just want the crying to stop and for your child to feel confident. You're especially interested to hear about the video solutions for every problem - so they're never stuck alone.`,
      urgencyLevel: 'high',
      difficultyModifier: -0.1,
    },
  ],
};

export function getScenariosForPersona(personaType: PersonaType): Scenario[] {
  const personaSpecific = personaScenarios[personaType] || [];
  return [...universalScenarios, ...personaSpecific];
}

export function getScenarioById(personaType: PersonaType, scenarioId: string): Scenario | undefined {
  const scenarios = getScenariosForPersona(personaType);
  return scenarios.find(s => s.id === scenarioId);
}
