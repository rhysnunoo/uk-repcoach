import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import OpenAI from 'openai';
import { personas } from '@/lib/practice/personas';
import { scorePracticeSession } from '@/lib/scoring/practice-scoring';
import type { PracticeMessage, SessionState, PersonaType, ScriptContent } from '@/types/database';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

interface PracticeRouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: PracticeRouteParams) {
  const { id: sessionId } = await params;

  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch session (use admin client to bypass RLS)
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

    if (session.status !== 'active') {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
    }

    // Parse body
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get persona config
    const persona = personas[session.persona as PersonaType];
    const currentState = (session.session_state || {}) as SessionState;
    const messages = (session.messages || []) as PracticeMessage[];
    const scriptContent = session.scripts?.content as ScriptContent | null;

    // Build conversation history
    const conversationHistory = messages.map((msg) => ({
      role: msg.role === 'rep' ? 'user' as const : 'assistant' as const,
      content: msg.content,
    }));

    // Add new message
    conversationHistory.push({
      role: 'user' as const,
      content: message,
    });

    // Generate response from GPT-4
    const systemPrompt = buildSystemPrompt(persona, scriptContent, currentState);

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    // Parse response and extract state
    const { cleanResponse, newState } = parseProspectResponse(responseContent, currentState);

    // Check if session should end
    const shouldEnd = checkSessionEnd(newState, messages.length + 2);

    // Add messages
    const newMessages: PracticeMessage[] = [
      ...messages,
      { role: 'rep', content: message, timestamp: new Date().toISOString() },
      { role: 'prospect', content: cleanResponse, timestamp: new Date().toISOString() },
    ];

    // Update session (admin client already initialized above)
    await adminClient
      .from('practice_sessions')
      .update({
        messages: newMessages,
        session_state: newState,
        status: shouldEnd ? 'completed' : 'active',
        ended_at: shouldEnd ? new Date().toISOString() : null,
      })
      .eq('id', sessionId);

    // If ended, score the session
    if (shouldEnd) {
      await scoreSession(sessionId, newMessages, persona, scriptContent);
    }

    return NextResponse.json({
      response: cleanResponse,
      state: newState,
      ended: shouldEnd,
    });
  } catch (error) {
    console.error('Practice message error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: PracticeRouteParams) {
  const { id: sessionId } = await params;

  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch session (use admin client to bypass RLS)
    const { data: session } = await adminClient
      .from('practice_sessions')
      .select('*, scripts(*)')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.rep_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse body
    const body = await request.json();
    const { action } = body;

    if (action === 'end') {
      // Mark as completed (admin client already initialized above)
      await adminClient
        .from('practice_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      // Score the session
      const persona = personas[session.persona as PersonaType];
      const scriptContent = session.scripts?.content as ScriptContent | null;
      await scoreSession(
        sessionId,
        session.messages as PracticeMessage[],
        persona,
        scriptContent
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Practice PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: PracticeRouteParams) {
  const { id: sessionId } = await params;

  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile to check role - only admins can delete
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete practice sessions' }, { status: 403 });
    }

    // Delete the practice session
    const { error: deleteError } = await adminClient
      .from('practice_sessions')
      .delete()
      .eq('id', sessionId);

    if (deleteError) {
      console.error('Failed to delete practice session:', deleteError);
      return NextResponse.json({ error: 'Failed to delete practice session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting practice session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildSystemPrompt(
  persona: typeof personas[PersonaType],
  scriptContent: Record<string, unknown> | null,
  currentState: SessionState
): string {
  // Get prospect info from state
  const prospectName = (currentState as Record<string, unknown>).prospect_name as string || 'the parent';

  let prompt = `## CRITICAL ROLE INSTRUCTIONS
YOU ARE THE PROSPECT (the parent receiving the sales call). You are NOT the sales rep.
- The USER messages are from the SALES REP who is practicing their pitch
- YOUR responses are as the PROSPECT (parent) reacting to the sales rep
- NEVER pitch the product, sell, or act like you work for MyEdSpace
- NEVER say things like "I can help you with that" or "Let me tell you about our program"
- You are being SOLD TO, not doing the selling
- Respond naturally as a parent would when receiving a sales call

`;

  prompt += persona.system_prompt;

  // Add your identity
  prompt += `\n\n## Your Identity
You are ${prospectName}, a parent who received a call from a MyEdSpace sales rep.
Always respond as ${prospectName} - you are the PROSPECT being called, not the caller.
The rep should discover your child's name and details during the call - don't volunteer this information immediately.
If the rep asks about your child, make up a realistic name and grade level appropriate for the course being discussed.
Remember: You are the PARENT receiving this call. React to what the sales rep says, ask questions, raise objections - but NEVER try to sell the product yourself.`;

  // Add scenario context if available
  const scenarioContext = (currentState as Record<string, unknown>).scenario_context as string;
  const scenarioName = (currentState as Record<string, unknown>).scenario_name as string;
  const urgencyLevel = (currentState as Record<string, unknown>).urgency_level as string;

  if (scenarioContext) {
    prompt += `\n\n## Your Specific Situation
${scenarioContext}

Urgency Level: ${urgencyLevel || 'medium'} - ${
      urgencyLevel === 'high'
        ? 'You have pressing needs and may be ready to decide quickly if convinced.'
        : urgencyLevel === 'low'
        ? 'You have no immediate pressure to make a decision.'
        : 'You want to find the right solution but are not in a rush.'
    }`;
  }

  // Add script context if available
  if (scriptContent) {
    const courseDetails = scriptContent.course_details as { name?: string; schedule?: { days?: string; pacific_time?: string } } | undefined;
    const pricing = scriptContent.pricing as { annual_premium?: { price?: number }; monthly_premium?: { price?: number }; trial?: { price?: number } } | undefined;
    const sellVacation = (scriptContent.closer_phases as Record<string, unknown>)?.sell_vacation as { eddie_intro?: string; proof_points?: Record<string, string> } | undefined;

    prompt += `\n\n## Product Context (What the rep is selling)
The rep is selling MyEdSpace ${courseDetails?.name || 'math tutoring'} program.

Key Product Info:
- Course: ${courseDetails?.name || 'Math'} - Live classes ${courseDetails?.schedule?.days || 'twice a week'} at ${courseDetails?.schedule?.pacific_time || '5pm'} Pacific
- Teacher: Eddie Kang - UCLA Pure Mathematics degree, Perfect SAT Math score, 9+ years teaching
- Annual: $${pricing?.annual_premium?.price || 539} (less than $17/hr for 60 hours)
- Monthly: $${pricing?.monthly_premium?.price || 149}/month, cancel anytime
- Trial: $${pricing?.trial?.price || 7} for 7 days full access

Key Proof Points:
${sellVacation?.proof_points ? Object.entries(sellVacation.proof_points).map(([key, val]) => `- ${key}: ${val}`).join('\n') : '- 83% report attitude improvement\n- 20-30 chat messages per student per lesson\n- Best Online School 2025, 95% parent satisfaction'}`;
  }

  // Add current state context
  prompt += `\n\n## Current Conversation State
- Current warmth level: ${(currentState.warmth * 100).toFixed(0)}%
- Objections already raised: ${currentState.objections_raised.length > 0 ? currentState.objections_raised.join(', ') : 'None yet'}
- Topics discussed: ${currentState.topics_covered.length > 0 ? currentState.topics_covered.join(', ') : 'None yet'}
- Close attempted: ${currentState.close_attempted ? 'Yes' : 'No'}`;

  return prompt;
}

function parseProspectResponse(
  response: string,
  currentState: SessionState
): { cleanResponse: string; newState: SessionState } {
  // Extract state from hidden JSON block
  const stateMatch = response.match(/<!--STATE:(.*?)-->/s);
  let newState = { ...currentState };

  if (stateMatch) {
    try {
      const parsedState = JSON.parse(stateMatch[1]);
      newState = {
        warmth: parsedState.warmth ?? currentState.warmth,
        objections_raised: parsedState.objections_raised ?? currentState.objections_raised,
        topics_covered: parsedState.topics_covered ?? currentState.topics_covered,
        close_attempted: parsedState.close_attempted ?? currentState.close_attempted,
        outcome: parsedState.outcome ?? currentState.outcome,
      };
    } catch {
      // Keep current state if parsing fails
    }
  }

  // Clean response
  const cleanResponse = response
    .replace(/<!--STATE:.*?-->/s, '')
    .trim();

  return { cleanResponse, newState };
}

function checkSessionEnd(state: SessionState, messageCount: number): boolean {
  // End if outcome is determined
  if (state.outcome === 'closed' || state.outcome === 'declined') {
    return true;
  }

  // End if warmth drops too low
  if (state.warmth <= 0.1) {
    return true;
  }

  // End after too many messages (timeout)
  if (messageCount > 30) {
    return true;
  }

  return false;
}

async function scoreSession(
  sessionId: string,
  messages: PracticeMessage[],
  persona: typeof personas[PersonaType],
  scriptContent: ScriptContent | null
) {
  const adminClient = createAdminClient();

  try {
    console.log(`[scoreSession] Scoring practice session ${sessionId} with CLOSER framework...`);

    // Use the comprehensive CLOSER framework scoring
    const scoreResult = await scorePracticeSession(
      messages,
      persona.name,
      persona.description,
      scriptContent
    );

    console.log(`[scoreSession] Score result: ${scoreResult.overallScore}%`);

    // Store detailed feedback including phase scores as JSON
    const detailedFeedback = JSON.stringify({
      feedback: scoreResult.overallFeedback,
      phaseScores: scoreResult.phaseScores,
      strengths: scoreResult.strengths,
      improvements: scoreResult.improvements,
    });

    // Update session with score
    await adminClient
      .from('practice_sessions')
      .update({
        final_score: scoreResult.overallScore,
        final_feedback: detailedFeedback,
      })
      .eq('id', sessionId);

    console.log(`[scoreSession] Practice session ${sessionId} scored successfully`);
  } catch (error) {
    console.error('Failed to score practice session:', error);
    // Store error feedback
    await adminClient
      .from('practice_sessions')
      .update({
        final_score: 0,
        final_feedback: JSON.stringify({
          feedback: 'Unable to score session. Please try again.',
          phaseScores: [],
          strengths: [],
          improvements: [],
        }),
      })
      .eq('id', sessionId);
  }
}
