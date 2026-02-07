import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/supabase/server';
import { fetchRingoverCalls, fetchCallDetails } from '@/lib/ringover/client';

// Test endpoint to see what data Ringover returns for calls
// Only accessible to admins
export async function GET() {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch recent calls
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const calls = await fetchRingoverCalls(oneWeekAgo, new Date(), 5);

    if (calls.length === 0) {
      return NextResponse.json({ message: 'No calls found in the last week' });
    }

    // Get details for the first call
    const firstCall = calls[0];
    const callDetails = await fetchCallDetails(firstCall.call_id);

    return NextResponse.json({
      message: 'Recent Ringover call data',
      callCount: calls.length,
      sampleCall: firstCall,
      callDetails: callDetails,
      // Show all keys to see what fields are available
      availableFields: {
        callKeys: Object.keys(firstCall),
        contactKeys: firstCall.contact ? Object.keys(firstCall.contact) : null,
        userKeys: firstCall.user ? Object.keys(firstCall.user) : null,
      }
    });
  } catch (error) {
    console.error('Test call error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch calls' },
      { status: 500 }
    );
  }
}
