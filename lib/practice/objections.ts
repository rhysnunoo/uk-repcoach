// Common objections for quick-fire objection handling practice

export interface Objection {
  id: string;
  category: 'price' | 'timing' | 'trust' | 'competition' | 'need' | 'authority';
  objection: string;
  context?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tips: string[];
  sampleResponse: string;
}

export const objections: Objection[] = [
  // Price Objections
  {
    id: 'price_too_expensive',
    category: 'price',
    objection: "That's too expensive. We can't afford that right now.",
    difficulty: 'medium',
    tips: [
      'Acknowledge their concern',
      'Break down the cost per hour/session',
      'Compare to alternatives (private tutors cost $60-100/hr)',
      'Focus on the value and results',
    ],
    sampleResponse: "I completely understand - budgets are tight. Let me share something: at $539 for the year, that's less than $17 per hour for 60 hours of live instruction. Compare that to private tutors at $60-100 an hour. Plus, most parents tell us the improvement in grades and confidence makes it worth every penny. What if we started with the 7-day trial for just $7 to see if it's a good fit?",
  },
  {
    id: 'price_compare_kumon',
    category: 'price',
    objection: "Kumon is cheaper than this.",
    difficulty: 'hard',
    tips: [
      'Know your competitor pricing (Kumon is ~$150/month)',
      'Highlight live instruction vs worksheets',
      'Emphasize engagement and results',
      'Point out hidden costs (drive time, gas)',
    ],
    sampleResponse: "Actually, Kumon runs about $150 a month for worksheets - we're comparable or less for live instruction. The big difference is your child gets real teaching from Eddie, not just repetitive worksheets. Plus, you save drive time and gas. Most parents who switch from Kumon tell us their kids are way more engaged when they can ask questions in real-time.",
  },
  {
    id: 'price_free_options',
    category: 'price',
    objection: "Can't we just use Khan Academy? It's free.",
    difficulty: 'medium',
    tips: [
      'Acknowledge Khan Academy is great',
      'Highlight the difference: passive vs interactive',
      'Mention accountability and structure',
      'Share that many students use both',
    ],
    sampleResponse: "Khan Academy is fantastic - we actually recommend it for extra practice! The difference is that with free videos, your child is learning alone without anyone to answer questions or notice when they're confused. Our live classes mean Eddie can see exactly where students struggle and address it immediately. That real-time feedback is what drives the breakthrough moments.",
  },

  // Timing Objections
  {
    id: 'timing_not_now',
    category: 'timing',
    objection: "We're not ready to commit to anything right now. Maybe next semester.",
    difficulty: 'medium',
    tips: [
      'Understand their reason for waiting',
      'Create urgency without being pushy',
      'Mention the cost of waiting (falling further behind)',
      'Offer the low-commitment trial',
    ],
    sampleResponse: "I hear you - timing matters. Can I ask what's making you want to wait? The reason I ask is that math builds on itself, and most parents who wait tell us they wish they hadn't because their child fell further behind. What if we did the 7-day trial now? That way you can see if it works before committing to anything bigger.",
  },
  {
    id: 'timing_school_just_started',
    category: 'timing',
    objection: "School just started. Let's see how they do first.",
    difficulty: 'easy',
    tips: [
      'Acknowledge the logic',
      'Share the risk of waiting',
      'Mention early intervention benefits',
      'Suggest getting ahead instead of catching up',
    ],
    sampleResponse: "That makes sense - you want to give them a chance. Here's what we've found though: the parents who catch issues early in the semester have kids who stay confident all year. Waiting until they're already struggling means playing catch-up. Starting now means your child builds strong foundations from day one. Would you rather prevent a problem or fix one?",
  },
  {
    id: 'timing_think_about_it',
    category: 'timing',
    objection: "I need to think about it.",
    difficulty: 'hard',
    tips: [
      'Don\'t argue - acknowledge',
      'Ask what specifically they need to think about',
      'Address any hidden concerns',
      'Offer to help with their decision process',
    ],
    sampleResponse: "Of course - this is an important decision for your family. Can I ask what specifically you want to think through? Sometimes I can help clarify things, and even if not, I want to make sure you have all the information you need to make the best decision for your child.",
  },

  // Trust/Skepticism Objections
  {
    id: 'trust_tried_before',
    category: 'trust',
    objection: "We've tried tutoring before and it didn't work.",
    difficulty: 'hard',
    tips: [
      'Show empathy',
      'Ask what they tried and what went wrong',
      'Explain how this is different',
      'Offer specific evidence/guarantees',
    ],
    sampleResponse: "I'm sorry to hear that - that's frustrating. What did you try before, and what went wrong? I ask because we hear this a lot, and usually it's one of a few things: boring worksheets, tutors who couldn't explain things well, or kids who just didn't engage. Eddie's classes are designed specifically to avoid those problems - live, interactive, and students actually participate with 20-30 chat messages per class.",
  },
  {
    id: 'trust_online_concern',
    category: 'trust',
    objection: "I don't think online learning works. Kids just zone out.",
    difficulty: 'medium',
    tips: [
      'Acknowledge the valid concern',
      'Explain engagement mechanisms',
      'Share engagement statistics',
      'Offer to let them observe a class',
    ],
    sampleResponse: "That's a valid concern - a lot of online learning is just videos kids ignore. What makes our classes different is they're live and interactive. Eddie calls on students, they answer in the chat, and there's real back-and-forth. We track engagement - average students send 20-30 messages per class. They can't zone out because they're constantly participating.",
  },
  {
    id: 'trust_proof',
    category: 'trust',
    objection: "How do I know this actually works?",
    difficulty: 'easy',
    tips: [
      'Share specific statistics',
      'Mention awards and recognition',
      'Offer testimonials or references',
      'Point to the trial as risk-free proof',
    ],
    sampleResponse: "Great question - 83% of parents report their child's attitude toward math improved within the first month. We were named Best Online School 2025 with 95% parent satisfaction. But honestly, the best proof is the 7-day trial. You'll see firsthand how your child responds to Eddie's teaching. If it doesn't work, you've risked $7. If it does, you've found the solution.",
  },

  // Competition Objections
  {
    id: 'competition_shopping',
    category: 'competition',
    objection: "I'm talking to a few different companies. What makes you different?",
    difficulty: 'medium',
    tips: [
      'Don\'t badmouth competitors',
      'Focus on unique differentiators',
      'Ask what they\'re comparing',
      'Highlight live instruction advantage',
    ],
    sampleResponse: "Smart to compare options! Who else are you looking at? The main thing that sets us apart is Eddie himself - UCLA math degree, perfect SAT score, 9 years experience - teaching live, twice a week. Most services are either expensive private tutors or self-paced videos. We're live group instruction at an affordable price. What matters most to you in making this decision?",
  },
  {
    id: 'competition_mathnasium',
    category: 'competition',
    objection: "We're thinking about Mathnasium instead.",
    difficulty: 'medium',
    tips: [
      'Acknowledge Mathnasium is reputable',
      'Compare pricing and convenience',
      'Highlight specific differences',
      'Don\'t be defensive',
    ],
    sampleResponse: "Mathnasium does good work! Here's the difference: they're about $400/month for in-person sessions, and you have to drive there. We're $539 for the whole year with classes from home. Both work - it really depends on whether your child does better with in-person attention or the convenience and consistency of online live classes. What's your sense of what your child needs?",
  },

  // Need Objections
  {
    id: 'need_grades_ok',
    category: 'need',
    objection: "My child's grades are actually okay. They're getting Bs.",
    difficulty: 'easy',
    tips: [
      'Acknowledge their success',
      'Explore if they could be doing better',
      'Discuss confidence vs. grades',
      'Mention building for future challenges',
    ],
    sampleResponse: "That's great that they're doing okay! Can I ask - are they working hard for those Bs, or is it coming easily? Sometimes B students are actually struggling more than they show. And looking ahead, as math gets harder in high school, building strong foundations now means they stay confident. Is your child enjoying math, or just getting through it?",
  },
  {
    id: 'need_summer',
    category: 'need',
    objection: "They're doing fine. We'll get help if they start struggling.",
    difficulty: 'medium',
    tips: [
      'Respect their assessment',
      'Share the cost of reactive vs proactive',
      'Plant seeds for future contact',
      'Offer value even if not buying now',
    ],
    sampleResponse: "I respect that - you know your child best. One thing I'll mention: parents who wait until struggling often say they wish they'd started earlier, because catching up is harder than staying ahead. If things are good now, that's awesome. Would you be open to me checking in next semester, or if you'd like, we can stay in touch in case things change?",
  },

  // Authority Objections
  {
    id: 'authority_spouse',
    category: 'authority',
    objection: "I need to talk to my husband/wife about this first.",
    difficulty: 'medium',
    tips: [
      'Acknowledge this is a family decision',
      'Offer to loop them in',
      'Ask what concerns the spouse might have',
      'Provide materials to share',
    ],
    sampleResponse: "Absolutely - this is definitely a family decision. Is your spouse available to join us now, even for a few minutes? If not, what questions do you think they'll have? I want to make sure you have everything you need to explain it to them. And I'm happy to send you a summary email you can share.",
  },
  {
    id: 'authority_child_decides',
    category: 'authority',
    objection: "I need to see if my child even wants to do this.",
    difficulty: 'easy',
    tips: [
      'Validate the importance of buy-in',
      'Suggest the trial as a test',
      'Share how kids typically respond',
      'Offer engagement guarantees',
    ],
    sampleResponse: "That's so important - if they're not into it, it won't work. Here's what I suggest: try the 7-day trial and let them experience a class. Most kids are skeptical at first, but once they see Eddie's teaching style and start participating in the chat, they actually enjoy it. If after a class or two they hate it, you'll know. Fair?",
  },
];

// Get objections by category
export function getObjectionsByCategory(category: Objection['category']): Objection[] {
  return objections.filter(o => o.category === category);
}

// Get objections by difficulty
export function getObjectionsByDifficulty(difficulty: Objection['difficulty']): Objection[] {
  return objections.filter(o => o.difficulty === difficulty);
}

// Get random objections for a drill
export function getRandomObjections(count: number, options?: {
  categories?: Objection['category'][];
  difficulties?: Objection['difficulty'][];
}): Objection[] {
  let filtered = [...objections];

  if (options?.categories?.length) {
    filtered = filtered.filter(o => options.categories!.includes(o.category));
  }
  if (options?.difficulties?.length) {
    filtered = filtered.filter(o => options.difficulties!.includes(o.difficulty));
  }

  // Shuffle and take count
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Category labels for UI
export const categoryLabels: Record<Objection['category'], string> = {
  price: 'Price & Budget',
  timing: 'Timing & Urgency',
  trust: 'Trust & Skepticism',
  competition: 'Competition',
  need: 'Need & Fit',
  authority: 'Decision Authority',
};

// Difficulty labels
export const difficultyLabels: Record<Objection['difficulty'], string> = {
  easy: 'Beginner',
  medium: 'Intermediate',
  hard: 'Advanced',
};
