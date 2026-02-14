import { NextResponse } from 'next/server';
import { syncRingoverCalls } from '@/lib/ringover/sync';

export async function GET(request: Request) {
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
    // Sync last 24 hours
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);

    const result = await syncRingoverCalls('cron', startDate);

    return NextResponse.json({
      success: true,
      synced: result.synced,
      failed: result.failed,
      skipped: result.skipped,
      transcribing: result.transcribing,
    });
  } catch (error) {
    console.error('Cron Ringover sync failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
