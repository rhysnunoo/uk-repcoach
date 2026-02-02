import { NextRequest, NextResponse } from 'next/server';
import { syncHubspotCalls } from '@/lib/hubspot/sync';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Sync calls from last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const sinceTimestamp = yesterday.toISOString();

    const result = await syncHubspotCalls('cron', sinceTimestamp);

    console.log('Cron sync completed:', result);

    return NextResponse.json({
      success: true,
      synced: result.synced,
      failed: result.failed,
      skipped: result.skipped,
      transcribing: result.transcribing,
    });
  } catch (error) {
    console.error('Cron sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

// Also support POST for manual cron triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
