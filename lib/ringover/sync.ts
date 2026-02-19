import { createAdminClient } from '@/lib/supabase/admin';
import {
  fetchRingoverCalls,
  fetchCallTranscription,
  type RingoverCall,
  type RingoverTranscriptSegment,
} from './client';
import type { TranscriptSegment } from '@/types/database';

// Minimum call duration in seconds to consider for syncing
const MIN_CALL_DURATION_SECONDS = 60;

interface SyncResult {
  synced: number;
  failed: number;
  skipped: number;
  transcribing: number;
  errors: string[];
}

export async function syncRingoverCalls(
  syncType: 'manual' | 'cron',
  startDate?: Date,
  minDurationSeconds: number = MIN_CALL_DURATION_SECONDS
): Promise<SyncResult> {
  const adminClient = createAdminClient();
  const result: SyncResult = {
    synced: 0,
    failed: 0,
    skipped: 0,
    transcribing: 0,
    errors: [],
  };

  // Create sync log entry
  const { data: syncLog } = await adminClient
    .from('ringover_sync_log')
    .insert({
      sync_type: syncType,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  try {
    // Fetch calls from Ringover
    const ringoverCalls = await fetchRingoverCalls(startDate);
    console.log(`Fetched ${ringoverCalls.length} calls from Ringover`);

    // Get user mapping (ringover_user_id -> profile_id)
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, ringover_user_id')
      .not('ringover_user_id', 'is', null);

    const userMap = new Map<string, string>();
    profiles?.forEach((p) => {
      if (p.ringover_user_id) {
        userMap.set(p.ringover_user_id, p.id);
      }
    });

    // Get default script (first active one)
    const { data: scripts } = await adminClient
      .from('scripts')
      .select('id')
      .eq('is_active', true)
      .limit(1);

    const defaultScriptId = scripts?.[0]?.id || null;

    // Process each call
    for (const ringoverCall of ringoverCalls) {
      try {
        // Only sync answered calls
        if (ringoverCall.last_state !== 'ANSWERED') {
          result.skipped++;
          continue;
        }

        // Skip if already synced
        const { data: existingCall } = await adminClient
          .from('calls')
          .select('id')
          .eq('ringover_call_id', ringoverCall.call_id)
          .single();

        if (existingCall) {
          result.skipped++;
          continue;
        }

        // Map Ringover user to rep
        const ringoverUserId = String(ringoverCall.user?.user_id || '');
        const repId = ringoverUserId ? userMap.get(ringoverUserId) : null;

        if (!repId) {
          result.skipped++;
          result.errors.push(
            `Skipped call ${ringoverCall.call_id}: No rep mapping for user ${ringoverUserId || 'unknown'}`
          );
          continue;
        }

        // Skip calls shorter than minimum duration
        const callDuration = ringoverCall.incall_duration || ringoverCall.total_duration;
        if (callDuration < minDurationSeconds) {
          result.skipped++;
          continue;
        }

        // Get contact details
        let contactName = 'Unknown';
        let contactPhone = ringoverCall.direction === 'out'
          ? ringoverCall.to_number
          : ringoverCall.from_number;

        if (ringoverCall.contact) {
          const firstName = ringoverCall.contact.firstname || '';
          const lastName = ringoverCall.contact.lastname || '';
          contactName = `${firstName} ${lastName}`.trim() || 'Unknown';
        }

        // Try to fetch transcript from Ringover
        const ringoverTranscript = await fetchCallTranscription(ringoverCall.call_id, ringoverCall.direction);
        const transcript = parseRingoverTranscript(ringoverTranscript);

        const hasTranscript = transcript.length > 0;
        const hasRecordingUrl = !!ringoverCall.record;

        // Determine status based on what we have
        let status: 'pending' | 'transcribing' | 'scoring' | 'complete';
        if (hasTranscript) {
          status = 'scoring'; // Has transcript, ready to score
        } else if (hasRecordingUrl) {
          status = 'transcribing'; // Has recording, needs transcription
        } else {
          // No transcript and no recording - skip
          result.skipped++;
          continue;
        }

        // Insert call
        const { data: newCall, error: insertError } = await adminClient
          .from('calls')
          .insert({
            rep_id: repId,
            script_id: defaultScriptId,
            source: 'ringover',
            status,
            ringover_call_id: ringoverCall.call_id,
            recording_url: ringoverCall.record || null,
            transcript: hasTranscript ? transcript : null,
            duration_seconds: callDuration,
            call_date: new Date(ringoverCall.start_time).toISOString(),
            contact_name: contactName,
            contact_phone: contactPhone,
            outcome: ringoverCall.last_state,
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        result.synced++;

        // Trigger next step based on status
        if (newCall) {
          if (hasTranscript) {
            // Has transcript - score it
            triggerScoring(newCall.id);
          } else if (hasRecordingUrl) {
            // Has recording but no transcript - transcribe it
            result.transcribing++;
            triggerTranscription(newCall.id, ringoverCall.record!);
          }
        }
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Failed to sync call ${ringoverCall.call_id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
  } catch (error) {
    result.errors.push(
      `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Update sync log
  if (syncLog) {
    await adminClient
      .from('ringover_sync_log')
      .update({
        ended_at: new Date().toISOString(),
        calls_synced: result.synced,
        calls_failed: result.failed,
        error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
        details: {
          skipped: result.skipped,
          transcribing: result.transcribing,
          total_fetched: result.synced + result.failed + result.skipped,
        },
      })
      .eq('id', syncLog.id);
  }

  return result;
}

function parseRingoverTranscript(
  segments: RingoverTranscriptSegment[] | null
): TranscriptSegment[] {
  if (!segments || segments.length === 0) {
    return [];
  }

  return segments.map((segment) => ({
    speaker: segment.speaker === 'agent' ? 'rep' : 'prospect',
    text: segment.text,
    start_time: Math.floor(segment.start_time),
    end_time: Math.floor(segment.end_time),
  }));
}

async function triggerScoring(callId: string) {
  try {
    const { scoreCall } = await import('@/lib/scoring/score');
    await scoreCall(callId);
  } catch (error) {
    console.error(`Failed to score call ${callId}:`, error);
  }
}

async function triggerTranscription(callId: string, recordingUrl: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    await fetch(`${baseUrl}/api/calls/${callId}/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recordingUrl }),
    });
  } catch (error) {
    console.error('Failed to trigger transcription:', error);
  }
}
