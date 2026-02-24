// Common objections for quick-fire objection handling practice (UK MyEdSpace)

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
      'Break down the cost per lesson (£4-5 per lesson)',
      'Compare to alternatives (private tutors cost £40-60/hr)',
      'Focus on the value and results',
    ],
    sampleResponse: "I completely understand - it's a real investment. Let me put it in perspective: at £319 for the year, that's around £4.31 per lesson for 74 hours of live teaching from top 1% teachers. Compare that to a private tutor at £40-60 an hour. Plus, 58% of our GCSE students achieved grades 7-9 last year. What if we started with the 10-day trial for just £10 to see if it's a good fit?",
  },
  {
    id: 'price_compare_tutor',
    category: 'price',
    objection: "We already have a private tutor. Why would we switch?",
    difficulty: 'hard',
    tips: [
      'Don\'t badmouth their tutor',
      'Highlight live instruction vs 1-on-1 limitations',
      'Emphasise teacher credentials and examining experience',
      'Point out cost difference (£40-60/hr vs £4-5/lesson)',
    ],
    sampleResponse: "Private tutors can be brilliant. Can I ask - what qualifications does the tutor have? The reason I ask is our teachers are in the top 1% nationally. For GCSE Maths, you get someone like Neil Trivedi - 1st Class from UCL, 9+ years teaching. Or Guy Maycock with over a decade of examining experience - he literally knows what markers are looking for. At £4-5 per lesson versus £40-60 an hour for a tutor, you're getting elite-level teaching at a fraction of the cost.",
  },
  {
    id: 'price_free_options',
    category: 'price',
    objection: "Can't we just use BBC Bitesize or YouTube? They're free.",
    difficulty: 'medium',
    tips: [
      'Acknowledge these are useful resources',
      'Highlight the difference: passive vs interactive',
      'Mention accountability and structure',
      'Share engagement stats (25 messages per lesson)',
    ],
    sampleResponse: "BBC Bitesize and YouTube are great for revision snippets - we actually recommend them for extra practice! The difference is, with free videos, your child is learning alone with no one to answer questions or notice when they're confused. Our lessons are live and interactive - on average, students send 25 messages per lesson. That's real-time engagement. Plus every practice problem has a video solution. That's the difference between free and effective.",
  },

  // Timing Objections
  {
    id: 'timing_not_now',
    category: 'timing',
    objection: "We're not ready to commit right now. Maybe next term.",
    difficulty: 'medium',
    tips: [
      'Understand their reason for waiting',
      'Create urgency without being pushy',
      'Mention the cost of waiting (falling further behind)',
      'Offer the low-commitment trial',
    ],
    sampleResponse: "I hear you - timing matters. Can I ask what's making you want to wait? The reason I ask is that the curriculum builds on itself, and most parents who wait tell us they wish they hadn't because their child fell further behind. What if we did the 10-day trial for £10? That way you can see if it works before committing to anything bigger.",
  },
  {
    id: 'timing_term_just_started',
    category: 'timing',
    objection: "The school year's just started. Let's see how they get on first.",
    difficulty: 'easy',
    tips: [
      'Acknowledge the logic',
      'Share the risk of waiting',
      'Mention early intervention benefits',
      'Suggest getting ahead instead of catching up',
    ],
    sampleResponse: "That makes sense - you want to give them a chance. Here's what we've found though: parents who catch issues early in the year have children who stay confident all year. Waiting until they're already struggling means playing catch-up. Starting now means your child builds strong foundations from day one. Would you rather prevent a problem or fix one?",
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
    sampleResponse: "Of course - this is an important decision for your family. What specifically are you weighing up? Sometimes I can help clarify things, and even if not, I want to make sure you have all the information you need. And remember, the 14-day money-back guarantee means you can start today and still have two weeks to decide.",
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
    sampleResponse: "I'm sorry to hear that - that's frustrating. What did you try before, and what went wrong? I ask because we hear this a lot, and usually it comes down to a few things: rotating tutors who don't know the child, boring worksheets, or kids who just don't engage. Our teachers are permanent - same elite teacher every lesson. And the lessons are live and interactive - students average 25 messages per lesson. That's not kids zoning out.",
  },
  {
    id: 'trust_online_concern',
    category: 'trust',
    objection: "Online learning doesn't work. Kids just zone out in front of screens.",
    difficulty: 'medium',
    tips: [
      'Acknowledge the valid concern (especially post-COVID)',
      'Explain engagement mechanisms',
      'Share engagement statistics',
      'Mention no camera/no speaking requirement reduces anxiety',
    ],
    sampleResponse: "That's a completely fair concern - especially after what happened during COVID. The difference is our lessons aren't passive. Students interact through chat in real-time - answering questions, asking their own, working through problems. On average, each student sends 25 messages per lesson. And here's something parents love: no camera, no speaking out loud. Shy students actually participate MORE because it's all through chat.",
  },
  {
    id: 'trust_proof',
    category: 'trust',
    objection: "How do I know this actually works?",
    difficulty: 'easy',
    tips: [
      'Share specific statistics',
      'Mention Trustpilot reviews',
      'Offer trial as risk-free proof',
      'Reference GCSE results',
    ],
    sampleResponse: "Great question. Last year, 58% of our GCSE students achieved grades 7-9 - that's more than double the national average. We have 1,700+ five-star reviews on Trustpilot and 95% parent satisfaction. But honestly, the best proof is the 10-day trial. You'll see firsthand how your child responds. If it doesn't work, you've risked £10. If it does, you've found the solution.",
  },

  // Competition Objections
  {
    id: 'competition_shopping',
    category: 'competition',
    objection: "I'm looking at a few different options. What makes you different?",
    difficulty: 'medium',
    tips: [
      'Don\'t badmouth competitors',
      'Focus on unique differentiators',
      'Ask what they\'re comparing',
      'Highlight teacher quality and results',
    ],
    sampleResponse: "Smart to compare options! Who else are you looking at? The main thing that sets us apart is our teachers - they're in the top 1% nationally, combined 100+ years experience, and some are actual exam markers. Plus it's live teaching, not pre-recorded videos. Most services are either expensive private tutors or passive platforms. We're live expert teaching at an affordable price. What matters most to you?",
  },
  {
    id: 'competition_kumon',
    category: 'competition',
    objection: "We're thinking about Kumon instead.",
    difficulty: 'medium',
    tips: [
      'Acknowledge Kumon is established',
      'Compare approach: worksheets vs live teaching',
      'Highlight price and convenience differences',
      'Don\'t be defensive',
    ],
    sampleResponse: "Kumon is well-known! Here's the key difference: Kumon is worksheet-based with a supervisor watching. There's no actual teaching. With us, elite teachers TEACH live - they explain concepts, break things down, make it click. Kumon runs about £60-80/month per subject, and you have to drive there. We're £80/month for live lessons from home with top 1% teachers. Both work differently - it depends on whether your child needs teaching or just practice.",
  },

  // Need Objections
  {
    id: 'need_grades_ok',
    category: 'need',
    objection: "My child's grades are actually okay. They're getting 5s and 6s.",
    difficulty: 'easy',
    tips: [
      'Acknowledge their success',
      'Explore if they could be doing better',
      'Discuss confidence vs. grades',
      'Mention building for future challenges (GCSEs, A-Levels)',
    ],
    sampleResponse: "That's great that they're doing well! Can I ask - are they working hard for those grades, or is it coming easily? Sometimes students at that level are actually capable of 7s, 8s, or 9s but just need the right teaching to unlock it. 58% of our GCSE students got 7-9 last year. Is your child enjoying the subject, or just getting through it?",
  },
  {
    id: 'need_wait_and_see',
    category: 'need',
    objection: "They're fine for now. We'll get help if they start properly struggling.",
    difficulty: 'medium',
    tips: [
      'Respect their assessment',
      'Share the cost of reactive vs proactive',
      'Plant seeds for future contact',
      'Offer value even if not buying now',
    ],
    sampleResponse: "I respect that - you know your child best. One thing I'll mention: parents who wait until their child is properly struggling often say they wish they'd started earlier, because catching up is much harder than staying ahead. If things are good now, that's brilliant. Would you be open to me checking in next half-term?",
  },

  // Authority Objections
  {
    id: 'authority_spouse',
    category: 'authority',
    objection: "I need to speak to my husband/wife about this first.",
    difficulty: 'medium',
    tips: [
      'Acknowledge this is a family decision',
      'Offer to loop them in',
      'Ask what concerns the partner might have',
      'Plant the 14-day guarantee as safety net',
    ],
    sampleResponse: "Completely understand - this is definitely a family decision. Is your partner around now? Even for a few minutes? If not, what questions do you think they'll have? I want to make sure you have everything you need. And here's something that helps: we have a 14-day money-back guarantee. So even if you start today, your partner can see it in action and if either of you decides it's not right, full refund.",
  },
  {
    id: 'authority_child_decides',
    category: 'authority',
    objection: "I need to see if my child even wants to do this.",
    difficulty: 'easy',
    tips: [
      'Validate the importance of buy-in',
      'Suggest the trial as a test',
      'Share how students typically respond',
      'Mention no camera/no speaking to reduce anxiety',
    ],
    sampleResponse: "That's so important - if they're not into it, it won't work. Here's what I suggest: try the 10-day trial for £10 and let them experience a lesson. Most students are skeptical at first, but once they see the teaching style and start interacting through chat, they actually enjoy it. And there's no camera and no speaking out loud - so it's not intimidating. If after a couple of lessons they hate it, you'll know. Fair?",
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

  // Fisher-Yates shuffle
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }
  const shuffled = filtered;
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
