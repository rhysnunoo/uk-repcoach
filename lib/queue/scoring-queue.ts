import { createAdminClient } from '@/lib/supabase/admin';
import { scoreCall as performScoring } from '@/lib/scoring/score';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s

/**
 * Queue a call for scoring with automatic retry.
 * IMPORTANT: This function awaits the full scoring pipeline.
 * The caller must ensure the request has enough time (maxDuration >= 120s).
 */
export async function queueCallForScoring(callId: string): Promise<void> {
  const adminClient = createAdminClient();

  // Update call status to scoring
  await adminClient
    .from('calls')
    .update({
      status: 'scoring',
      error_message: null,
    })
    .eq('id', callId);

  // Process scoring synchronously with retries
  await processScoringJob(callId);
}

/**
 * Process a scoring job with retry logic.
 * All retries happen inline (no setTimeout) so Vercel doesn't kill them.
 */
async function processScoringJob(callId: string): Promise<void> {
  const adminClient = createAdminClient();
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[ScoringQueue] Processing call ${callId} (attempt ${attempt}/${MAX_RETRIES})`);
      await performScoring(callId);
      console.log(`[ScoringQueue] Successfully scored call ${callId}`);
      return; // Success — exit
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[ScoringQueue] Attempt ${attempt} failed for call ${callId}:`, lastError);

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt - 1] || 15000;
        console.log(`[ScoringQueue] Retrying call ${callId} in ${delay}ms`);

        // Update status to show retry in progress
        await adminClient
          .from('calls')
          .update({
            error_message: `Attempt ${attempt} failed: ${lastError}. Retrying...`,
          })
          .eq('id', callId);

        // Inline delay — no setTimeout, so Vercel won't kill it
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries exhausted
  console.error(`[ScoringQueue] Max retries exceeded for call ${callId}`);
  await adminClient
    .from('calls')
    .update({
      status: 'error',
      error_message: `Scoring failed after ${MAX_RETRIES} attempts. Last error: ${lastError}`,
    })
    .eq('id', callId);
}

/**
 * Retry all failed scoring jobs
 */
export async function retryFailedScoringJobs(): Promise<{ retried: number; errors: string[] }> {
  const adminClient = createAdminClient();

  // Find all calls stuck in error state that have transcripts
  const { data: failedCalls, error } = await adminClient
    .from('calls')
    .select('id')
    .eq('status', 'error')
    .not('transcript', 'is', null)
    .limit(10);

  if (error) {
    return { retried: 0, errors: [error.message] };
  }

  const errors: string[] = [];
  let retried = 0;

  for (const call of failedCalls || []) {
    try {
      await queueCallForScoring(call.id);
      retried++;
    } catch (err) {
      errors.push(`Failed to queue ${call.id}: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }

  return { retried, errors };
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  failed: number;
  completed_today: number;
}> {
  const adminClient = createAdminClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pending, processing, failed, completedToday] = await Promise.all([
    adminClient
      .from('calls')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .not('transcript', 'is', null),
    adminClient
      .from('calls')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'scoring'),
    adminClient
      .from('calls')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'error'),
    adminClient
      .from('calls')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'complete')
      .gte('updated_at', today.toISOString()),
  ]);

  return {
    pending: pending.count || 0,
    processing: processing.count || 0,
    failed: failed.count || 0,
    completed_today: completedToday.count || 0,
  };
}
