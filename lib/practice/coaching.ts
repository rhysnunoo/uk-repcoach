import type { PracticeMessage, SessionState, ScriptContent } from '@/types/database';

export interface CoachingHint {
  type: 'phase_reminder' | 'technique' | 'objection_tip' | 'warning' | 'encouragement';
  title: string;
  message: string;
  scriptExample?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface PhaseProgress {
  phase: string;
  label: string;
  completed: boolean;
  current: boolean;
}

const CLOSER_PHASES = [
  { phase: 'opening', label: 'Opening', keywords: ['hello', 'hi', 'name is', 'calling from', 'myedspace'] },
  { phase: 'clarify', label: 'Clarify', keywords: ['why', 'what brings', 'tell me', 'situation', 'struggling', 'challenge'] },
  { phase: 'label', label: 'Label', keywords: ['sounds like', 'so you\'re', 'if i understand', 'what i\'m hearing'] },
  { phase: 'overview', label: 'Overview/Pain', keywords: ['tried', 'before', 'worked', 'failed', 'frustrat', 'cost', 'impact'] },
  { phase: 'sell_vacation', label: 'Sell Vacation', keywords: ['imagine', 'picture', 'what if', 'results', 'students', 'success', 'eddie', 'teacher'] },
  { phase: 'explain', label: 'Explain/AAA', keywords: ['understand', 'hear you', 'makes sense', 'acknowledge', 'other parents'] },
  { phase: 'reinforce', label: 'Reinforce/Close', keywords: ['option', 'tier', 'annual', 'monthly', 'trial', 'start', 'today', 'ready'] },
];

export function detectCurrentPhase(messages: PracticeMessage[]): string {
  const repMessages = messages.filter(m => m.role === 'rep').map(m => m.content.toLowerCase());

  if (repMessages.length === 0) return 'opening';

  const allRepText = repMessages.join(' ');

  // Work backwards through phases to find the most advanced phase reached
  for (let i = CLOSER_PHASES.length - 1; i >= 0; i--) {
    const phase = CLOSER_PHASES[i];
    const hasKeywords = phase.keywords.some(kw => allRepText.includes(kw));
    if (hasKeywords) {
      // Return the next phase as current (what they should work on)
      return CLOSER_PHASES[Math.min(i + 1, CLOSER_PHASES.length - 1)].phase;
    }
  }

  return 'opening';
}

export function getPhaseProgress(messages: PracticeMessage[]): PhaseProgress[] {
  const repMessages = messages.filter(m => m.role === 'rep').map(m => m.content.toLowerCase());
  const allRepText = repMessages.join(' ');

  let foundIncomplete = false;

  return CLOSER_PHASES.map((phase, index) => {
    const hasKeywords = phase.keywords.some(kw => allRepText.includes(kw));
    const completed = hasKeywords && !foundIncomplete;

    if (!completed && !foundIncomplete) {
      foundIncomplete = true;
      return { phase: phase.phase, label: phase.label, completed: false, current: true };
    }

    return { phase: phase.phase, label: phase.label, completed, current: false };
  });
}

// Helper to extract script example from script content
function getScriptExample(scriptContent: ScriptContent | null, phase: string, index: number = 0): string | undefined {
  if (!scriptContent?.closer_phases) return undefined;
  const phaseData = scriptContent.closer_phases[phase as keyof typeof scriptContent.closer_phases];
  if (phaseData?.exact_script && Array.isArray(phaseData.exact_script)) {
    return `"${phaseData.exact_script[index] || phaseData.exact_script[0]}"`;
  }
  return undefined;
}

// Helper to get pricing from script
function getPricingExample(scriptContent: ScriptContent | null): string {
  if (!scriptContent?.pricing) {
    return 'Present your pricing options clearly.';
  }
  const p = scriptContent.pricing;
  const parts = [];
  if (p.annual_premium?.price) parts.push(`annual plan at $${p.annual_premium.price}`);
  if (p.monthly_premium?.price) parts.push(`monthly at $${p.monthly_premium.price}`);
  if (p.trial?.price) parts.push(`$${p.trial.price} trial`);
  return parts.length > 0
    ? `"We have options: ${parts.join(', ')}. Which sounds like the best fit?"`
    : 'Present your pricing options clearly.';
}

// Helper to get teacher info from script
function getTeacherInfo(scriptContent: ScriptContent | null): { name: string; credentials: string } {
  const teacher = scriptContent?.course_details?.teacher;
  if (teacher) {
    return {
      name: teacher.name || 'the teacher',
      credentials: Array.isArray(teacher.credentials) ? teacher.credentials.join(', ') : '',
    };
  }
  return { name: 'the teacher', credentials: '' };
}

export function generateCoachingHints(
  messages: PracticeMessage[],
  sessionState: SessionState | null,
  lastProspectMessage: string | null,
  scriptContent?: ScriptContent | null
): CoachingHint[] {
  const hints: CoachingHint[] = [];
  const currentPhase = detectCurrentPhase(messages);
  const repMessages = messages.filter(m => m.role === 'rep');
  const lastRepMessage = repMessages[repMessages.length - 1]?.content.toLowerCase() || '';
  const messageCount = messages.length;
  const teacher = getTeacherInfo(scriptContent || null);

  // Phase-specific hints with actual script content
  switch (currentPhase) {
    case 'opening':
      if (messageCount === 0) {
        hints.push({
          type: 'phase_reminder',
          title: 'Start with a Strong Opening',
          message: 'Introduce yourself, establish credibility, and set the agenda for the call.',
          scriptExample: getScriptExample(scriptContent || null, 'opening') ||
            '"Hi [Name], this is [Your Name] from MyEdSpace. Thanks for booking time with me today..."',
          priority: 'high',
        });
      }
      break;

    case 'clarify':
      hints.push({
        type: 'phase_reminder',
        title: 'Time to Clarify',
        message: 'Ask open-ended questions to understand their situation. Get them talking about their child\'s struggles.',
        scriptExample: getScriptExample(scriptContent || null, 'clarify') ||
          '"So what\'s going on with math that made you reach out?"',
        priority: 'high',
      });
      break;

    case 'label':
      hints.push({
        type: 'phase_reminder',
        title: 'Label Their Problem',
        message: 'Reflect back what you heard to show understanding and get confirmation.',
        scriptExample: getScriptExample(scriptContent || null, 'label') ||
          '"So let me make sure I\'ve got this right. [Child] is in [Grade] taking [Course]. The main challenge is [pain]. Is that accurate?"',
        priority: 'high',
      });
      break;

    case 'overview':
      hints.push({
        type: 'phase_reminder',
        title: 'Explore the Pain',
        message: 'This is the most important phase. Ask about past attempts and why they failed. Understand the emotional and practical cost.',
        scriptExample: getScriptExample(scriptContent || null, 'overview') ||
          '"What have you tried so far to help [child] with math? How did that go?"',
        priority: 'high',
      });

      // Check if they explored past attempts
      const askedAboutPast = lastRepMessage.includes('tried') || lastRepMessage.includes('before');
      if (!askedAboutPast && messageCount > 4) {
        hints.push({
          type: 'technique',
          title: 'Don\'t Skip Pain Exploration',
          message: 'Before presenting the solution, make sure you\'ve explored what they\'ve tried before and why it didn\'t work.',
          priority: 'high',
        });
      }
      break;

    case 'sell_vacation':
      hints.push({
        type: 'phase_reminder',
        title: 'Paint the Picture',
        message: `Help them visualize success. Mention ${teacher.name}${teacher.credentials ? ` (${teacher.credentials})` : ''} and what their child's life could look like.`,
        scriptExample: getScriptExample(scriptContent || null, 'sell_vacation') ||
          `"Our teacher ${teacher.name} has ${teacher.credentials || 'extensive experience'}. Imagine [child] actually looking forward to math class..."`,
        priority: 'high',
      });
      break;

    case 'explain':
      hints.push({
        type: 'phase_reminder',
        title: 'Handle Objections with AAA',
        message: 'Acknowledge their concern, Associate with others who felt the same, then Ask or Alter their perspective.',
        scriptExample: getScriptExample(scriptContent || null, 'explain') ||
          '"I totally understand that concern. A lot of parents feel the same way initially. Can I share what other families have experienced?"',
        priority: 'high',
      });
      break;

    case 'reinforce':
      hints.push({
        type: 'phase_reminder',
        title: 'Time to Close',
        message: 'Present the options clearly, create urgency, and ask for the commitment.',
        scriptExample: getPricingExample(scriptContent || null),
        priority: 'high',
      });
      break;
  }

  // Objection detection hints - use script content if available
  if (lastProspectMessage) {
    const prospectLower = lastProspectMessage.toLowerCase();
    const objectionHandling = scriptContent?.closer_phases?.explain?.common_objections;

    if (prospectLower.includes('expensive') || prospectLower.includes('cost') || prospectLower.includes('price') || prospectLower.includes('afford')) {
      const priceResponse = objectionHandling?.price?.response ||
        objectionHandling?.['too_expensive']?.response ||
        'Explore what they\'re comparing it to and reframe the value.';
      hints.push({
        type: 'objection_tip',
        title: 'Price Objection Detected',
        message: 'Don\'t defend the price. Instead, explore what they\'re comparing it to and reframe the value.',
        scriptExample: `"${priceResponse}"`,
        priority: 'high',
      });
    }

    if (prospectLower.includes('spouse') || prospectLower.includes('husband') || prospectLower.includes('wife') || prospectLower.includes('partner')) {
      const spouseResponse = objectionHandling?.spouse?.response ||
        objectionHandling?.['need_spouse']?.response ||
        'Offer to include the spouse or give them ammunition to convince them.';
      hints.push({
        type: 'objection_tip',
        title: 'Spouse Objection Detected',
        message: 'Don\'t let them off the hook. Offer to include the spouse or give them ammunition to convince them.',
        scriptExample: `"${spouseResponse}"`,
        priority: 'high',
      });
    }

    if (prospectLower.includes('think about') || prospectLower.includes('let me') || prospectLower.includes('get back')) {
      const thinkResponse = objectionHandling?.timing?.response ||
        objectionHandling?.['think_about_it']?.response ||
        'This usually means you haven\'t addressed their real concern. Dig deeper.';
      hints.push({
        type: 'objection_tip',
        title: '"Think About It" Detected',
        message: 'This usually means you haven\'t addressed their real concern. Dig deeper.',
        scriptExample: `"${thinkResponse}"`,
        priority: 'high',
      });
    }

    if (prospectLower.includes('tried') && (prospectLower.includes('didn\'t work') || prospectLower.includes('failed'))) {
      hints.push({
        type: 'objection_tip',
        title: 'Past Failure Mentioned',
        message: 'Great opportunity! Explore what specifically didn\'t work and differentiate your solution.',
        scriptExample: '"That\'s actually really helpful to know. What specifically didn\'t work about that? Was it the format, the engagement, or something else?"',
        priority: 'medium',
      });
    }
  }

  // Warmth-based hints
  if (sessionState) {
    if (sessionState.warmth < 0.3) {
      hints.push({
        type: 'warning',
        title: 'Prospect Going Cold',
        message: 'Their warmth is dropping. Try showing more empathy and asking about their feelings, not just facts.',
        priority: 'high',
      });
    }

    if (sessionState.warmth > 0.7 && currentPhase !== 'reinforce') {
      hints.push({
        type: 'encouragement',
        title: 'Great Rapport!',
        message: 'The prospect is engaged. Start moving toward the close when appropriate.',
        priority: 'low',
      });
    }
  }

  // Timing hints
  if (messageCount > 20 && currentPhase !== 'reinforce') {
    hints.push({
      type: 'warning',
      title: 'Call Running Long',
      message: 'You\'ve exchanged many messages. Make sure you\'re progressing toward the close.',
      priority: 'medium',
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  hints.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return hints.slice(0, 3); // Return top 3 hints
}

// Note: Objection responses are now pulled from script content in generateCoachingHints
// The common_objections field in closer_phases.explain contains the actual script responses
