import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getProfile } from '@/lib/supabase/server';

export async function GET() {
  try {
    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Managers see all profiles; reps see only their own
    if (profile.role === 'manager' || profile.role === 'admin') {
      const { data: profiles, error } = await adminClient
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Failed to fetch profiles:', error);
        return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
      }

      return NextResponse.json({ profiles });
    }

    // Non-managers only see their own profile
    return NextResponse.json({ profiles: [{ id: profile.id, full_name: profile.full_name, role: profile.role }] });
  } catch (error) {
    console.error('Profiles API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getProfile();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized - please log in' }, { status: 401 });
    }

    console.log('[Profile PATCH] Current user role:', currentUser.role);

    // Only managers and admins can update profiles
    if (currentUser.role !== 'manager' && currentUser.role !== 'admin') {
      return NextResponse.json({ error: `Forbidden - your role is ${currentUser.role}` }, { status: 403 });
    }

    const body = await request.json();
    const { profileId, full_name, role } = body;

    if (!profileId) {
      return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const updates: { full_name?: string; role?: 'rep' | 'manager' | 'admin' } = {};

    if (full_name !== undefined) {
      updates.full_name = full_name;
    }

    if (role !== undefined) {
      // Only admins can change roles
      if (currentUser.role !== 'admin') {
        return NextResponse.json({ error: `Only admins can change roles (you are ${currentUser.role})` }, { status: 403 });
      }
      const validRoles = ['rep', 'manager', 'admin'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      updates.role = role;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const { error: updateError } = await adminClient
      .from('profiles')
      .update(updates)
      .eq('id', profileId);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      return NextResponse.json({ error: 'Database error: ' + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
