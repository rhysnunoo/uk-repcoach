import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import OpenAI from 'openai';
import { personas } from '@/lib/practice/personas';
import type { PracticeMessage, SessionState, PersonaType, ScriptContent } from '@/types/database';

export const dynamic = 'force-dynamic';
let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Generate model response for comparison at a specific point in the conversation
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: sessionId } = await params;

  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch session
    const { data: session, error: sessionError } = await adminClient
      .from('practice_sessions')
      .select('*, scripts(*)')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.rep_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse body - get the turn index to generate model response for
    const body = await request.json();
    const { turnIndex } = body;

    if (typeof turnIndex !== 'number' || turnIndex < 0) {
      return NextResponse.json({ error: 'Invalid turn index' }, { status: 400 });
    }

    const messages = (session.messages || []) as PracticeMessage[];
    const sessionState = (session.session_state || {}) as SessionState;
    const persona = personas[session.persona as PersonaType];
    const scriptContent = session.scripts?.content as ScriptContent | null;

    // Build conversation history up to the specified turn
    // We want to generate what the rep SHOULD have said at turnIndex
    const conversationUpToTurn = messages.slice(0, turnIndex);

    // The last message should be from the prospect (what they said before the rep's turn)
    const lastProspectMessage = conversationUpToTurn
      .filter(m => m.role === 'prospect')
      .pop();

    // Build the conversation for OpenAI
    const conversationHistory = conversationUpToTurn.map((msg) => ({
      role: msg.role === 'rep' ? 'user' as const : 'assistant' as const,
      content: msg.content,
    }));

    // Generate model response
    const systemPrompt = buildModelResponsePrompt(persona, scriptContent, sessionState, lastProspectMessage?.content);

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const modelResponse = completion.choices[0]?.message?.content || '';

    return NextResponse.json({
      modelResponse,
      turnIndex,
    });
  } catch (error) {
    console.error('Error generating model response:', error);
    return NextResponse.json(
      { error: 'Failed to generate model response' },
      { status: 500 }
    );
  }
}

function buildModelResponsePrompt(
  persona: typeof personas[PersonaType],
  scriptContent: Record<string, unknown> | null,
  sessionState: SessionState,
  lastProspectMessage?: string
): string {
  let prompt = `You are an expert sales coach demonstrating the IDEAL response for a sales rep.

## Context
The sales rep is practicing a call with a simulated prospect. You need to generate what an EXCELLENT sales rep would say next.

## The Prospect
Name: ${(sessionState as Record<string, unknown>).prospect_name || 'Parent'}
Persona: ${persona.name}
Description: ${persona.description}
Traits: ${persona.traits.join(', ')}

## Current Conversation State
- Warmth level: ${(sessionState.warmth * 100).toFixed(0)}%
- Objections raised: ${sessionState.objections_raised?.length > 0 ? sessionState.objections_raised.join(', ') : 'None'}
- Topics covered: ${sessionState.topics_covered?.length > 0 ? sessionState.topics_covered.join(', ') : 'None'}

`;

  if (lastProspectMessage) {
    prompt += `## Last Thing the Prospect Said
"${lastProspectMessage}"

`;
  }

  // Add script context with actual script lines
  if (scriptContent) {
    const closerPhases = scriptContent.closer_phases as Record<string, unknown> | undefined;
    const courseDetails = scriptContent.course_details as { teacher?: { name: string; credentials?: string[] } } | undefined;
    const pricing = scriptContent.pricing as Record<string, { price?: number }> | undefined;

    prompt += `## ACTUAL SCRIPT CONTENT (Use these exact lines)

### Teacher Info
${courseDetails?.teacher ? `- Name: ${courseDetails.teacher.name}
- Credentials: ${Array.isArray(courseDetails.teacher.credentials) ? courseDetails.teacher.credentials.join(', ') : 'Expert math teacher'}` : ''}

### Pricing
${pricing?.annual_premium ? `- Annual: $${pricing.annual_premium.price}` : ''}
${pricing?.monthly_premium ? `- Monthly: $${pricing.monthly_premium.price}` : ''}
${pricing?.trial ? `- Trial: $${pricing.trial.price}` : ''}

### Script Lines by Phase
`;
    if (closerPhases) {
      const phaseOrder = ['opening', 'clarify', 'label', 'overview', 'sell_vacation', 'explain', 'reinforce'];
      for (const phase of phaseOrder) {
        const phaseData = closerPhases[phase] as {
          purpose?: string;
          exact_script?: string[];
          key_questions?: string[];
        } | undefined;
        if (phaseData) {
          prompt += `**${phase.toUpperCase()}**: ${phaseData.purpose || ''}\n`;
          if (phaseData.exact_script && Array.isArray(phaseData.exact_script)) {
            prompt += `Script: "${phaseData.exact_script[0]}"\n`;
          }
        }
      }
    }
  }

  prompt += `
## Instructions
Generate the IDEAL response for the sales rep at this point in the conversation.
- Use the CLOSER framework appropriately based on the conversation flow
- Be natural, warm, and consultative
- Handle any objections effectively
- Build rapport and uncover needs
- Stay focused on helping the prospect
- Keep the response concise and conversational (1-3 sentences typical)

CRITICAL: Use ONLY the script content provided above. Use the exact teacher name, credentials, and pricing from the script. Do NOT make up different details or statistics.

IMPORTANT: Only output the rep's response. No explanations or commentary.`;

  return prompt;
}
