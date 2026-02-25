import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
interface CallRouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: CallRouteParams) {
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
      .select('role')
      .eq('id', user.id)
      .single();

    // Fetch call
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (callError || !call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Check access
    const isManager = profile?.role === 'manager' || profile?.role === 'admin';
    if (!isManager && call.rep_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch scores
    const { data: scores } = await supabase
      .from('scores')
      .select('*')
      .eq('call_id', callId);

    // Fetch notes
    const { data: notes } = await supabase
      .from('call_notes')
      .select('*')
      .eq('call_id', callId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      call,
      scores: scores || [],
      notes: notes || [],
    });
  } catch (error) {
    console.error('Error fetching call:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: CallRouteParams) {
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
      .select('role')
      .eq('id', user.id)
      .single();

    // Fetch call to verify ownership
    const { data: existingCall } = await supabase
      .from('calls')
      .select('rep_id')
      .eq('id', callId)
      .single();

    if (!existingCall) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Check access
    const isManager = profile?.role === 'manager' || profile?.role === 'admin';
    if (!isManager && existingCall.rep_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse body
    const body = await request.json();
    const allowedFields = ['contact_name', 'outcome', 'script_id'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Update call
    const { data: call, error: updateError } = await supabase
      .from('calls')
      .update(updates)
      .eq('id', callId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update call:', updateError);
      return NextResponse.json({ error: 'Failed to update call' }, { status: 500 });
    }

    return NextResponse.json({ call });
  } catch (error) {
    console.error('Error updating call:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: CallRouteParams) {
  const { id: callId } = await params;

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
      return NextResponse.json({ error: 'Only admins can delete calls' }, { status: 403 });
    }

    // Delete related records first (scores, notes)
    await adminClient.from('scores').delete().eq('call_id', callId);
    await adminClient.from('call_notes').delete().eq('call_id', callId);

    // Delete the call
    const { error: deleteError } = await adminClient
      .from('calls')
      .delete()
      .eq('id', callId);

    if (deleteError) {
      console.error('Failed to delete call:', deleteError);
      return NextResponse.json({ error: 'Failed to delete call' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting call:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
