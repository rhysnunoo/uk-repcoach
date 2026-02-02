import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchRingoverUsers, testRingoverConnection } from '@/lib/ringover/client';

export async function GET() {
  const supabase = await createClient();

  // Check user is authenticated and has manager/admin role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['manager', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Test connection
    const isConnected = await testRingoverConnection();

    if (!isConnected) {
      return NextResponse.json(
        { error: 'Unable to connect to Ringover', users: [], profiles: [] },
        { status: 200 }
      );
    }

    // Fetch Ringover users
    const ringoverUsers = await fetchRingoverUsers();

    // Fetch all profiles
    const adminClient = createAdminClient();
    const { data: profiles } = await adminClient.from('profiles').select('*');

    return NextResponse.json({
      users: ringoverUsers,
      profiles: profiles || [],
    });
  } catch (error) {
    console.error('Failed to fetch Ringover users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', users: [], profiles: [] },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();

  // Check user is authenticated and has manager/admin role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['manager', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { mappings } = await request.json();

    const adminClient = createAdminClient();

    // Update each profile with their Ringover user mapping
    for (const mapping of mappings) {
      await adminClient
        .from('profiles')
        .update({ ringover_user_id: mapping.ringoverUserId })
        .eq('id', mapping.profileId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save mappings:', error);
    return NextResponse.json(
      { error: 'Failed to save mappings' },
      { status: 500 }
    );
  }
}
