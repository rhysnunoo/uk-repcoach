import { NextRequest, NextResponse } from 'next/server';
import { getProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
interface ReassignRouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: ReassignRouteParams) {
  const { id: callId } = await params;

  try {
    // Check authorization - only managers/admins can reassign calls
    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (profile.role !== 'manager' && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only managers can reassign calls' }, { status: 403 });
    }

    const { rep_id } = await request.json();

    if (!rep_id) {
      return NextResponse.json({ error: 'rep_id is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Verify the target rep exists
    const { data: targetRep, error: repError } = await adminClient
      .from('profiles')
      .select('id, full_name')
      .eq('id', rep_id)
      .single();

    if (repError || !targetRep) {
      return NextResponse.json({ error: 'Invalid rep selected' }, { status: 400 });
    }

    // Update the call's rep_id
    const { error } = await adminClient
      .from('calls')
      .update({ rep_id })
      .eq('id', callId);

    if (error) {
      console.error('Failed to reassign call:', error);
      return NextResponse.json({ error: 'Failed to reassign call' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      rep_name: targetRep.full_name
    });
  } catch (error) {
    console.error('Reassign call error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to fetch available reps
export async function GET() {
  try {
    // Check authorization
    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (profile.role !== 'manager' && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only managers can view reps' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // Fetch all reps (users with role 'rep' or all users for admin)
    const { data: reps, error } = await adminClient
      .from('profiles')
      .select('id, full_name, email, role')
      .order('full_name');

    if (error) {
      console.error('Failed to fetch reps:', error);
      return NextResponse.json({ error: 'Failed to fetch reps' }, { status: 500 });
    }

    return NextResponse.json({ reps });
  } catch (error) {
    console.error('Fetch reps error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
