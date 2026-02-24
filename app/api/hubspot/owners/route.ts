import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchHubspotOwners } from '@/lib/hubspot/client';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is manager/admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'manager' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch HubSpot owners
    const hubspotOwners = await fetchHubspotOwners();

    // Get current mappings
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, hubspot_owner_id')
      .order('full_name');

    // Create mapping data
    const mappings = hubspotOwners.map((owner) => {
      const mappedProfile = profiles?.find((p) => p.hubspot_owner_id === owner.id);
      return {
        hubspot_owner: owner,
        mapped_profile: mappedProfile || null,
      };
    });

    return NextResponse.json({
      owners: hubspotOwners,
      profiles: profiles || [],
      mappings,
    });
  } catch (error) {
    console.error('Error fetching HubSpot owners:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch owners' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is manager/admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'manager' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse body
    const body = await request.json();
    const { mappings } = body as { mappings: Array<{ profileId: string; hubspotOwnerId: string | null }> };

    if (!mappings || !Array.isArray(mappings)) {
      return NextResponse.json({ error: 'Invalid mappings' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Update all mappings in parallel
    await Promise.all(mappings.map((mapping) =>
      adminClient.from('profiles')
        .update({ hubspot_owner_id: mapping.hubspotOwnerId })
        .eq('id', mapping.profileId)
    ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating mappings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update mappings' },
      { status: 500 }
    );
  }
}
