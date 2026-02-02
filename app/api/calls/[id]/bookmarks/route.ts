import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface Bookmark {
  id: string;
  start_time: number;
  end_time: number;
  note: string;
  tag: string;
  created_at: string;
  created_by: string;
}

interface BookmarkRouteParams {
  params: Promise<{ id: string }>;
}

// GET - Fetch bookmarks for a call
export async function GET(request: NextRequest, { params }: BookmarkRouteParams) {
  const { id: callId } = await params;

  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch call to check access - bookmarks column may not exist yet
    const { data: call, error: callError } = await adminClient
      .from('calls')
      .select('id, rep_id')
      .eq('id', callId)
      .single();

    if (callError || !call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Try to fetch bookmarks separately (column may not exist)
    let bookmarksData: Bookmark[] = [];
    try {
      const { data: callWithBookmarks } = await adminClient
        .from('calls')
        .select('bookmarks')
        .eq('id', callId)
        .single();
      bookmarksData = (callWithBookmarks?.bookmarks as Bookmark[]) || [];
    } catch {
      // Column doesn't exist yet - return empty array
      bookmarksData = [];
    }

    // Get user profile to check if manager
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isManager = profile?.role === 'manager' || profile?.role === 'admin';

    // Check access
    if (!isManager && call.rep_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ bookmarks: bookmarksData });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
  }
}

// POST - Create a new bookmark
export async function POST(request: NextRequest, { params }: BookmarkRouteParams) {
  const { id: callId } = await params;

  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch call
    const { data: call, error: callError } = await adminClient
      .from('calls')
      .select('id, rep_id, bookmarks')
      .eq('id', callId)
      .single();

    if (callError || !call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Get user profile
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role, full_name, email')
      .eq('id', user.id)
      .single();

    const isManager = profile?.role === 'manager' || profile?.role === 'admin';

    // Check access - only managers or the rep can add bookmarks
    if (!isManager && call.rep_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { start_time, end_time, note, tag } = body;

    if (typeof start_time !== 'number' || typeof end_time !== 'number') {
      return NextResponse.json({ error: 'Invalid time range' }, { status: 400 });
    }

    // Create new bookmark
    const newBookmark: Bookmark = {
      id: crypto.randomUUID(),
      start_time,
      end_time,
      note: note || '',
      tag: tag || 'other',
      created_at: new Date().toISOString(),
      created_by: profile?.full_name || profile?.email || user.id,
    };

    // Add to existing bookmarks
    const existingBookmarks = (call.bookmarks as Bookmark[]) || [];
    const updatedBookmarks = [...existingBookmarks, newBookmark];

    // Update call
    const { error: updateError } = await adminClient
      .from('calls')
      .update({ bookmarks: updatedBookmarks })
      .eq('id', callId);

    if (updateError) {
      console.error('Error updating call with bookmark:', updateError);
      return NextResponse.json({ error: 'Failed to save bookmark' }, { status: 500 });
    }

    return NextResponse.json({ bookmark: newBookmark });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 });
  }
}
