import { createAdminClient } from '@/lib/supabase/admin';
import { scoreCall as performScoring } from '@/lib/scoring/score';

interface ScoringJob {
  call_id: string;
  attempt: number;
  max_attempts: number;
  created_at: string;
  last_error?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s

/**
 * Queue a call for scoring with automatic retry
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

  // Start scoring in background
  processScoringJob({ call_id: callId, attempt: 1, max_attempts: MAX_RETRIES, created_at: new Date().toISOString() });
}

/**
 * Process a scoring job with retry logic
 */
async function processScoringJob(job: ScoringJob): Promise<void> {
  const adminClient = createAdminClient();

  try {
    console.log(`[ScoringQueue] Processing call ${job.call_id} (attempt ${job.attempt}/${job.max_attempts})`);

    // Perform scoring
    await performScoring(job.call_id);

    console.log(`[ScoringQueue] Successfully scored call ${job.call_id}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[ScoringQueue] Error scoring call ${job.call_id}:`, errorMessage);

    // Check if we should retry
    if (job.attempt < job.max_attempts) {
      const delay = RETRY_DELAYS[job.attempt - 1] || 15000;

      console.log(`[ScoringQueue] Scheduling retry ${job.attempt + 1} for call ${job.call_id} in ${delay}ms`);

      // Update status to show retry pending
      await adminClient
        .from('calls')
        .update({
          error_message: `Attempt ${job.attempt} failed: ${errorMessage}. Retrying...`,
        })
        .eq('id', job.call_id);

      // Schedule retry
      setTimeout(() => {
        processScoringJob({
          ...job,
          attempt: job.attempt + 1,
          last_error: errorMessage,
        });
      }, delay);
    } else {
      // Max retries exceeded - mark as error
      console.error(`[ScoringQueue] Max retries exceeded for call ${job.call_id}`);

      await adminClient
        .from('calls')
        .update({
          status: 'error',
          error_message: `Scoring failed after ${job.max_attempts} attempts. Last error: ${errorMessage}`,
        })
        .eq('id', job.call_id);
    }
  }
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
