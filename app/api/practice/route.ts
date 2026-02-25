import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { personas } from '@/lib/practice/personas';
import { getScenarioById } from '@/lib/practice/scenarios';
import type { PersonaType } from '@/types/database';

export const dynamic = 'force-dynamic';
// Random prospect names for practice sessions
const PROSPECT_NAMES = [
  'Sarah', 'Mike', 'Jennifer', 'David', 'Lisa', 'John', 'Emily', 'Chris',
  'Amanda', 'Brian', 'Michelle', 'Kevin', 'Jessica', 'Matt', 'Ashley', 'Ryan',
  'Nicole', 'Dan', 'Stephanie', 'Tom', 'Rachel', 'Steve', 'Lauren', 'Mark',
  'Heather', 'Jason', 'Megan', 'Eric', 'Amy', 'Jeff', 'Katie', 'Andrew',
];

function getRandomProspectName(): string {
  return PROSPECT_NAMES[Math.floor(Math.random() * PROSPECT_NAMES.length)];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Parse form data or JSON
    const contentType = request.headers.get('content-type');
    let scriptId: string;
    let persona: string;
    let scenarioId: string;
    let prospectName: string;

    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      scriptId = formData.get('scriptId') as string;
      persona = formData.get('persona') as string;
      scenarioId = formData.get('scenarioId') as string || 'standard';
    } else {
      const body = await request.json();
      scriptId = body.scriptId;
      persona = body.persona;
      scenarioId = body.scenarioId || 'standard';
    }

    // Always assign a random prospect name
    prospectName = getRandomProspectName();

    if (!scriptId || !persona) {
      if (contentType?.includes('application/x-www-form-urlencoded')) {
        return NextResponse.redirect(new URL('/practice?error=missing_fields', request.url));
      }
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate persona
    if (!Object.keys(personas).includes(persona)) {
      if (contentType?.includes('application/x-www-form-urlencoded')) {
        return NextResponse.redirect(new URL('/practice?error=invalid_persona', request.url));
      }
      return NextResponse.json({ error: 'Invalid persona' }, { status: 400 });
    }

    // Get scenario (defaults to standard if not found)
    const scenario = getScenarioById(persona as PersonaType, scenarioId);

    // Check for existing active session (use admin client to bypass RLS)
    const { data: existingSession } = await adminClient
      .from('practice_sessions')
      .select('id')
      .eq('rep_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingSession) {
      // Abandon existing session
      await adminClient
        .from('practice_sessions')
        .update({ status: 'abandoned', ended_at: new Date().toISOString() })
        .eq('id', existingSession.id);
    }

    // Create new session (use admin client to bypass RLS)
    const personaConfig = personas[persona as PersonaType];

    // Adjust warmth based on scenario difficulty
    const adjustedWarmth = Math.max(0.1, Math.min(0.9,
      personaConfig.initial_warmth + (scenario?.difficultyModifier ? -scenario.difficultyModifier * 0.5 : 0)
    ));

    const { data: session, error: insertError } = await adminClient
      .from('practice_sessions')
      .insert({
        rep_id: user.id,
        script_id: scriptId,
        persona: persona as PersonaType,
        status: 'active',
        messages: [],
        session_state: {
          warmth: adjustedWarmth,
          objections_raised: [],
          topics_covered: [],
          close_attempted: false,
          outcome: null,
          prospect_name: prospectName,
          scenario_id: scenarioId,
          scenario_name: scenario?.name || 'Standard Call',
          scenario_context: scenario?.contextModifier || '',
          urgency_level: scenario?.urgencyLevel || 'medium',
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create session:', insertError);
      if (contentType?.includes('application/x-www-form-urlencoded')) {
        return NextResponse.redirect(new URL('/practice?error=create_failed', request.url));
      }
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Redirect to session page
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      return NextResponse.redirect(new URL(`/practice/${session.id}`, request.url));
    }

    return NextResponse.json({ sessionId: session.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating practice session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
