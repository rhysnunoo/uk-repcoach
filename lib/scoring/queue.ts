import { createAdminClient } from '@/lib/supabase/admin';
import { scoreCall } from './score';

const MAX_CONCURRENT = 2;
const QUEUE_CHECK_INTERVAL = 5000;

interface QueueItem {
  callId: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  addedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  score?: number;
}

interface QueueState {
  items: Map<string, QueueItem>;
  processing: Set<string>;
  isRunning: boolean;
}

// In-memory queue state (single instance for the server)
const queueState: QueueState = {
  items: new Map(),
  processing: new Set(),
  isRunning: false,
};

/**
 * Add calls to the scoring queue
 */
export function addToQueue(callIds: string[]): void {
  for (const callId of callIds) {
    if (!queueState.items.has(callId)) {
      queueState.items.set(callId, {
        callId,
        status: 'pending',
        addedAt: new Date(),
      });
    }
  }

  // Start processing if not already running
  if (!queueState.isRunning) {
    processQueue();
  }
}

/**
 * Get current queue status
 */
export function getQueueStatus(): {
  total: number;
  pending: number;
  processing: number;
  complete: number;
  error: number;
  items: QueueItem[];
} {
  const items = Array.from(queueState.items.values());
  return {
    total: items.length,
    pending: items.filter((i) => i.status === 'pending').length,
    processing: items.filter((i) => i.status === 'processing').length,
    complete: items.filter((i) => i.status === 'complete').length,
    error: items.filter((i) => i.status === 'error').length,
    items,
  };
}

/**
 * Clear completed/errored items from queue
 */
export function clearCompleted(): void {
  for (const [callId, item] of queueState.items) {
    if (item.status === 'complete' || item.status === 'error') {
      queueState.items.delete(callId);
    }
  }
}

/**
 * Remove a specific item from queue
 */
export function removeFromQueue(callId: string): boolean {
  const item = queueState.items.get(callId);
  if (!item) return false;

  // Can only remove pending items
  if (item.status === 'pending') {
    queueState.items.delete(callId);
    return true;
  }
  return false;
}

/**
 * Process the queue
 */
async function processQueue(): Promise<void> {
  if (queueState.isRunning) return;
  queueState.isRunning = true;

  while (true) {
    // Get pending items
    const pendingItems = Array.from(queueState.items.values())
      .filter((i) => i.status === 'pending')
      .sort((a, b) => a.addedAt.getTime() - b.addedAt.getTime());

    // Check if we can process more
    const availableSlots = MAX_CONCURRENT - queueState.processing.size;
    if (availableSlots <= 0 || pendingItems.length === 0) {
      // Wait and check again if there are still items
      if (queueState.processing.size > 0 || pendingItems.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, QUEUE_CHECK_INTERVAL));
        continue;
      } else {
        // Queue is empty
        break;
      }
    }

    // Start processing up to available slots
    const toProcess = pendingItems.slice(0, availableSlots);
    for (const item of toProcess) {
      processItem(item);
    }

    // Brief wait before next iteration
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  queueState.isRunning = false;
}

/**
 * Process a single queue item
 */
async function processItem(item: QueueItem): Promise<void> {
  item.status = 'processing';
  item.startedAt = new Date();
  queueState.processing.add(item.callId);

  try {
    const result = await scoreCall(item.callId);

    item.status = 'complete';
    item.completedAt = new Date();
    item.score = result.overall_score;
  } catch (error) {
    console.error(`[Queue] Failed to score call ${item.callId}:`, error);
    item.status = 'error';
    item.completedAt = new Date();
    item.error = error instanceof Error ? error.message : 'Unknown error';

    // Update call status in database
    const adminClient = createAdminClient();
    await adminClient
      .from('calls')
      .update({
        status: 'error',
        error_message: item.error,
      })
      .eq('id', item.callId);
  } finally {
    queueState.processing.delete(item.callId);
  }
}

/**
 * Batch score all unscored calls
 */
export async function scoreAllPending(): Promise<{
  queued: number;
  callIds: string[];
}> {
  const adminClient = createAdminClient();

  // Find all calls that need scoring
  const { data: calls } = await adminClient
    .from('calls')
    .select('id')
    .in('status', ['pending', 'transcribing'])
    .not('transcript', 'is', null);

  // Also find failed calls that have transcripts
  const { data: failedCalls } = await adminClient
    .from('calls')
    .select('id')
    .eq('status', 'error')
    .not('transcript', 'is', null);

  const allCalls = [...(calls || []), ...(failedCalls || [])];
  const callIds = allCalls.map((c) => c.id);

  if (callIds.length > 0) {
    addToQueue(callIds);
  }

  return {
    queued: callIds.length,
    callIds,
  };
}

/**
 * Check if a call is in the queue
 */
export function isInQueue(callId: string): boolean {
  return queueState.items.has(callId);
}

/**
 * Get status of a specific call in queue
 */
export function getCallQueueStatus(callId: string): QueueItem | null {
  return queueState.items.get(callId) || null;
}
