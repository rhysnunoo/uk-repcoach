import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface NotesRouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: NotesRouteParams) {
  const { id: callId } = await params;

  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single() as { data: { role: string } | null };

    // Fetch call to verify access
    const { data: call } = await supabase
      .from('calls')
      .select('rep_id')
      .eq('id', callId)
      .single() as { data: { rep_id: string } | null };

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Check access
    const isManager = profile?.role === 'manager' || profile?.role === 'admin';
    if (!isManager && call.rep_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch notes
    const { data: notes, error } = await supabase
      .from('call_notes')
      .select('*, profiles!call_notes_author_id_fkey(full_name, email)')
      .eq('call_id', callId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: NotesRouteParams) {
  const { id: callId } = await params;

  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body
    const body = await request.json();
    const { content, is_flagged } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Verify call exists
    const { data: call } = await supabase
      .from('calls')
      .select('id')
      .eq('id', callId)
      .single();

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Create note - use admin client for proper type inference
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const adminClient = createAdminClient();
    const { data: note, error: insertError } = await adminClient
      .from('call_notes')
      .insert({
        call_id: callId,
        author_id: user.id,
        content: content.trim(),
        is_flagged: !!is_flagged,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create note:', insertError);
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
