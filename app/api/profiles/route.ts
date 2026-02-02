import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getProfile } from '@/lib/supabase/server';

export async function GET() {
  try {
    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Fetch all profiles (for rep selection dropdowns)
    const { data: profiles, error } = await adminClient
      .from('profiles')
      .select('id, full_name, email, role')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Failed to fetch profiles:', error);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Profiles API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
