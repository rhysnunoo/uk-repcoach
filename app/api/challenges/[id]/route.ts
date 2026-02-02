import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get challenge details with leaderboard
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: challengeId } = await params;

  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get challenge
    const { data: challenge, error: challengeError } = await adminClient
      .from('practice_challenges')
      .select('*, profiles!practice_challenges_created_by_fkey(full_name)')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Get participations with profiles for leaderboard
    const { data: participations } = await adminClient
      .from('challenge_participations')
      .select('*, profiles(full_name)')
      .eq('challenge_id', challengeId)
      .order('best_score', { ascending: false, nullsFirst: false });

    // Build leaderboard
    const leaderboard = participations?.map((p, index) => ({
      rep_id: p.rep_id,
      rep_name: p.profiles?.full_name || 'Unknown',
      best_score: p.best_score,
      attempts: p.attempts,
      completed_at: p.completed_at,
      rank: index + 1,
    })) || [];

    // Get user's participation
    const userParticipation = participations?.find(p => p.rep_id === user.id) || null;

    return NextResponse.json({
      challenge: {
        ...challenge,
        creator_name: challenge.profiles?.full_name || 'Unknown',
      },
      leaderboard,
      userParticipation,
    });
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return NextResponse.json({ error: 'Failed to fetch challenge' }, { status: 500 });
  }
}

// POST - Join challenge / Record attempt
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: challengeId } = await params;

  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, practice_session_id, score } = body;

    // Get challenge
    const { data: challenge } = await adminClient
      .from('practice_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (challenge.status !== 'active') {
      return NextResponse.json({ error: 'Challenge is not active' }, { status: 400 });
    }

    if (action === 'join') {
      // Check if already participating
      const { data: existing } = await adminClient
        .from('challenge_participations')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('rep_id', user.id)
        .single();

      if (existing) {
        return NextResponse.json({ message: 'Already participating' });
      }

      // Create participation
      const { data: participation, error } = await adminClient
        .from('challenge_participations')
        .insert({
          challenge_id: challengeId,
          rep_id: user.id,
          attempts: 0,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ participation }, { status: 201 });
    }

    if (action === 'record_attempt') {
      if (typeof score !== 'number') {
        return NextResponse.json({ error: 'Score is required' }, { status: 400 });
      }

      // Get or create participation
      let { data: participation } = await adminClient
        .from('challenge_participations')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('rep_id', user.id)
        .single();

      if (!participation) {
        const { data: newParticipation } = await adminClient
          .from('challenge_participations')
          .insert({
            challenge_id: challengeId,
            rep_id: user.id,
            attempts: 0,
          })
          .select()
          .single();
        participation = newParticipation;
      }

      // Update participation
      const newBestScore = participation.best_score === null || score > participation.best_score
        ? score
        : participation.best_score;

      const isCompleted = newBestScore >= challenge.target_score;

      const { data: updated, error } = await adminClient
        .from('challenge_participations')
        .update({
          best_score: newBestScore,
          attempts: participation.attempts + 1,
          practice_session_id: practice_session_id || participation.practice_session_id,
          completed_at: isCompleted && !participation.completed_at
            ? new Date().toISOString()
            : participation.completed_at,
        })
        .eq('id', participation.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        participation: updated,
        isNewBest: score > (participation.best_score || 0),
        isCompleted,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing challenge action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}

// DELETE - Delete challenge (managers/admins only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id: challengeId } = await params;

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
      return NextResponse.json({ error: 'Only managers can delete challenges' }, { status: 403 });
    }

    // Delete participations first
    await adminClient
      .from('challenge_participations')
      .delete()
      .eq('challenge_id', challengeId);

    // Delete challenge
    const { error } = await adminClient
      .from('practice_challenges')
      .delete()
      .eq('id', challengeId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    return NextResponse.json({ error: 'Failed to delete challenge' }, { status: 500 });
  }
}
