import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET - List challenges
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = adminClient
      .from('practice_challenges')
      .select('*, profiles!practice_challenges_created_by_fkey(full_name)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: challenges, error } = await query;

    if (error) {
      // Table might not exist yet - return empty array
      if (error.code === '42P01') {
        return NextResponse.json({ challenges: [], needsMigration: true });
      }
      throw error;
    }

    // Get participation counts and user's participation
    const challengeIds = challenges?.map(c => c.id) || [];

    const { data: participations } = await adminClient
      .from('challenge_participations')
      .select('challenge_id, rep_id, best_score, attempts, completed_at')
      .in('challenge_id', challengeIds);

    // Add participation data to challenges
    const enrichedChallenges = challenges?.map(challenge => {
      const challengeParticipations = participations?.filter(p => p.challenge_id === challenge.id) || [];
      const userParticipation = challengeParticipations.find(p => p.rep_id === user.id);

      return {
        ...challenge,
        creator_name: challenge.profiles?.full_name || 'Unknown',
        participant_count: challengeParticipations.length,
        user_participation: userParticipation || null,
      };
    });

    return NextResponse.json({ challenges: enrichedChallenges || [] });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}

// POST - Create a new challenge (managers/admins only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['manager', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Only managers can create challenges' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      challenge_type,
      persona,
      scenario_id,
      target_score,
      start_date,
      end_date,
    } = body;

    if (!title || !challenge_type || !target_score || !start_date || !end_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: challenge, error } = await adminClient
      .from('practice_challenges')
      .insert({
        title,
        description: description || '',
        created_by: user.id,
        challenge_type,
        persona: persona || null,
        scenario_id: scenario_id || null,
        target_score,
        start_date,
        end_date,
        status: new Date(start_date) <= new Date() ? 'active' : 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating challenge:', error);
      return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
    }

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
