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

interface BookmarkDeleteRouteParams {
  params: Promise<{ id: string; bookmarkId: string }>;
}

// DELETE - Delete a bookmark
export async function DELETE(request: NextRequest, { params }: BookmarkDeleteRouteParams) {
  const { id: callId, bookmarkId } = await params;

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
      .select('role')
      .eq('id', user.id)
      .single();

    const isManager = profile?.role === 'manager' || profile?.role === 'admin';

    // Only managers can delete bookmarks
    if (!isManager) {
      return NextResponse.json({ error: 'Only managers can delete bookmarks' }, { status: 403 });
    }

    // Remove bookmark
    const existingBookmarks = (call.bookmarks as Bookmark[]) || [];
    const updatedBookmarks = existingBookmarks.filter(b => b.id !== bookmarkId);

    if (existingBookmarks.length === updatedBookmarks.length) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    }

    // Update call
    const { error: updateError } = await adminClient
      .from('calls')
      .update({ bookmarks: updatedBookmarks })
      .eq('id', callId);

    if (updateError) {
      console.error('Error deleting bookmark:', updateError);
      return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
  }
}
