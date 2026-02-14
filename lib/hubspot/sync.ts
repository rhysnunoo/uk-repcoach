import { createAdminClient } from '@/lib/supabase/admin';
import { fetchHubspotCalls, fetchContactDetails, type HubspotCall } from './client';
import type { TranscriptSegment } from '@/types/database';
import { findDuplicateCall } from '@/lib/utils/deduplication';

// Minimum call duration in seconds to consider for syncing (filters out quick/failed calls)
const MIN_CALL_DURATION_SECONDS = 60;

interface SyncResult {
  synced: number;
  failed: number;
  skipped: number;
  transcribing: number;
  errors: string[];
}

export async function syncHubspotCalls(
  syncType: 'manual' | 'cron',
  sinceTimestamp?: string,
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
    .from('hubspot_sync_log')
    .insert({
      sync_type: syncType,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  try {
    // Fetch calls from HubSpot
    const hubspotCalls = await fetchHubspotCalls(sinceTimestamp);
    console.log(`Fetched ${hubspotCalls.length} calls from HubSpot`);

    // Get owner mapping
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, hubspot_owner_id')
      .not('hubspot_owner_id', 'is', null);

    const ownerMap = new Map<string, string>();
    profiles?.forEach((p) => {
      if (p.hubspot_owner_id) {
        ownerMap.set(p.hubspot_owner_id, p.id);
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
    for (const hubspotCall of hubspotCalls) {
      try {
        // Skip if already synced
        const { data: existingCall } = await adminClient
          .from('calls')
          .select('id')
          .eq('hubspot_call_id', hubspotCall.id)
          .single();

        if (existingCall) {
          result.skipped++;
          continue;
        }

        // Map owner to rep
        const ownerId = hubspotCall.properties.hubspot_owner_id;
        const repId = ownerId ? ownerMap.get(ownerId) : null;

        if (!repId) {
          result.skipped++;
          result.errors.push(
            `Skipped call ${hubspotCall.id}: No rep mapping for owner ${ownerId}`
          );
          continue;
        }

        // Skip voicemails and no-answer calls
        const disposition = hubspotCall.properties.hs_call_disposition?.toLowerCase();
        if (
          disposition?.includes('voicemail') ||
          disposition?.includes('no answer') ||
          disposition?.includes('busy')
        ) {
          result.skipped++;
          continue;
        }

        // Calculate duration
        const durationSeconds = hubspotCall.properties.hs_call_duration
          ? parseInt(hubspotCall.properties.hs_call_duration, 10)
          : null;

        // Skip calls shorter than minimum duration
        if (durationSeconds !== null && durationSeconds < minDurationSeconds) {
          result.skipped++;
          continue;
        }

        // Get contact details (needed for deduplication check)
        let contactName = 'Unknown';
        let contactPhone = null;
        let contactId = null;

        if (hubspotCall.properties.hs_call_callee_object_id) {
          contactId = hubspotCall.properties.hs_call_callee_object_id;
          const contactDetails = await fetchContactDetails(contactId);
          if (contactDetails) {
            contactName = contactDetails.name;
            contactPhone = contactDetails.phone;
          }
        }

        // Check for duplicates from other sources (e.g., Ringover)
        const callTimestamp = hubspotCall.properties.hs_timestamp || new Date().toISOString();
        const { isDuplicate, existingCallId } = await findDuplicateCall(adminClient, {
          contactPhone,
          callDate: callTimestamp,
          durationSeconds,
          excludeSource: 'hubspot',
        });

        if (isDuplicate) {
          result.skipped++;
          result.errors.push(
            `Skipped call ${hubspotCall.id}: Duplicate found (existing call ${existingCallId}, possibly from Ringover)`
          );
          continue;
        }

        // Parse transcript from HubSpot
        const transcript = parseHubspotTranscript(
          hubspotCall.properties.hs_call_transcript ||
          hubspotCall.properties.hs_call_body || ''
        );

        const hasTranscript = transcript.length > 0;
        const hasRecordingUrl = !!hubspotCall.properties.hs_call_recording_url;

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
            source: 'hubspot',
            status,
            hubspot_call_id: hubspotCall.id,
            hubspot_contact_id: contactId,
            recording_url: hubspotCall.properties.hs_call_recording_url || null,
            transcript: hasTranscript ? transcript : null,
            duration_seconds: durationSeconds,
            call_date: hubspotCall.properties.hs_timestamp || new Date().toISOString(),
            contact_name: contactName,
            contact_phone: contactPhone,
            outcome: hubspotCall.properties.hs_call_disposition || null,
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
            triggerTranscription(newCall.id, hubspotCall.properties.hs_call_recording_url!);
          }
        }
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Failed to sync call ${hubspotCall.id}: ${
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
      .from('hubspot_sync_log')
      .update({
        ended_at: new Date().toISOString(),
        calls_synced: result.synced,
        calls_failed: result.failed,
        error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
        details: {
          skipped: result.skipped,
          total_fetched: result.synced + result.failed + result.skipped,
        },
      })
      .eq('id', syncLog.id);
  }

  return result;
}

function parseHubspotTranscript(transcriptText: string): TranscriptSegment[] {
  if (!transcriptText || transcriptText.trim().length === 0) {
    return [];
  }

  const segments: TranscriptSegment[] = [];

  // Common transcript formats:
  // [00:00] Speaker: Text
  // Speaker A: Text
  // Agent: Text / Customer: Text
  // Just plain text lines

  const lines = transcriptText.split('\n').filter((line) => line.trim());

  let currentTime = 0;
  const timeIncrement = 10; // Estimated seconds per line if no timestamps

  // First pass: parse all segments with raw speaker labels
  const rawSegments: Array<{ speaker: string; text: string; startTime: number; endTime: number }> = [];

  for (const line of lines) {
    // Try to extract timestamp [00:00] or (00:00) format
    const timestampMatch = line.match(/[\[\(]?(\d{1,2}):(\d{2})[\]\)]?\s*/);
    if (timestampMatch) {
      currentTime = parseInt(timestampMatch[1]) * 60 + parseInt(timestampMatch[2]);
    }

    // Try to extract speaker - expanded patterns
    const speakerMatch = line.match(/^(Agent|Rep|Sales|Salesperson|Caller|Customer|Prospect|Client|Contact|User|Speaker\s*[A-Z0-9]?|Person\s*[0-9]?)[\s:]+/i);

    let rawSpeaker = '';
    let text = line;

    if (speakerMatch) {
      rawSpeaker = speakerMatch[1].toLowerCase().trim();
      text = line.replace(speakerMatch[0], '').replace(timestampMatch?.[0] || '', '').trim();
    } else {
      text = line.replace(timestampMatch?.[0] || '', '').trim();
      // Use placeholder for unknown speaker
      rawSpeaker = segments.length > 0 ? 'unknown_alternating' : 'unknown_first';
    }

    if (text.length > 0) {
      rawSegments.push({
        speaker: rawSpeaker,
        text,
        startTime: currentTime,
        endTime: currentTime + timeIncrement,
      });
      currentTime += timeIncrement;
    }
  }

  // Second pass: determine speaker roles using content analysis
  const speakerMapping = determineHubspotSpeakerRoles(rawSegments);

  // Third pass: apply mapping and handle alternating speakers
  let lastSpeaker: 'rep' | 'prospect' = 'rep';

  for (const segment of rawSegments) {
    let speaker: 'rep' | 'prospect';

    if (segment.speaker.startsWith('unknown')) {
      // For unknown speakers, use content-based detection then alternate
      speaker = detectSpeakerFromContent(segment.text, lastSpeaker);
    } else {
      speaker = speakerMapping[segment.speaker] || 'prospect';
    }

    segments.push({
      speaker,
      text: segment.text,
      start_time: segment.startTime,
      end_time: segment.endTime,
    });

    lastSpeaker = speaker;
  }

  return segments;
}

/**
 * Determine speaker roles based on content analysis
 */
function determineHubspotSpeakerRoles(
  segments: Array<{ speaker: string; text: string }>
): Record<string, 'rep' | 'prospect'> {
  const speakerScores: Record<string, number> = {};
  const uniqueSpeakers = [...new Set(segments.map(s => s.speaker).filter(s => !s.startsWith('unknown')))];

  // Known speaker labels that are clearly rep or prospect
  const knownRepLabels = ['agent', 'rep', 'sales', 'salesperson', 'caller'];
  const knownProspectLabels = ['customer', 'prospect', 'client', 'contact', 'user'];

  // Initialize with known label bonuses
  uniqueSpeakers.forEach(speaker => {
    speakerScores[speaker] = 0;
    if (knownRepLabels.some(label => speaker.includes(label))) {
      speakerScores[speaker] += 10;
    }
    if (knownProspectLabels.some(label => speaker.includes(label))) {
      speakerScores[speaker] -= 10;
    }
  });

  // Rep indicator patterns
  const repPatterns = [
    /\b(my name is|i'm .* (from|with)|calling (from|about))/i,
    /\b(our (company|service|program|product))/i,
    /\b(we (offer|provide|specialize|help))/i,
    /\b(let me (explain|tell|share|walk))/i,
    /\b(payment|pricing|sign up|enroll|schedule)/i,
    /\b(great question|absolutely|definitely)/i,
  ];

  // Prospect indicator patterns
  const prospectPatterns = [
    /\b(my (son|daughter|child|kid|husband|wife))/i,
    /\b(how much|what's the (cost|price))/i,
    /\b(let me (think|talk to|check))/i,
    /\b(i('m| am) (not sure|thinking|considering))/i,
    /\b(what (is|are|does)|how (does|do))\b.*\?/i,
  ];

  // Score based on content
  segments.forEach((segment, index) => {
    if (segment.speaker.startsWith('unknown')) return;

    // First speaker bonus
    if (index === 0) {
      speakerScores[segment.speaker] = (speakerScores[segment.speaker] || 0) + 2;
    }

    repPatterns.forEach(pattern => {
      if (pattern.test(segment.text)) {
        speakerScores[segment.speaker] = (speakerScores[segment.speaker] || 0) + 2;
      }
    });

    prospectPatterns.forEach(pattern => {
      if (pattern.test(segment.text)) {
        speakerScores[segment.speaker] = (speakerScores[segment.speaker] || 0) - 2;
      }
    });
  });

  // Create mapping
  const mapping: Record<string, 'rep' | 'prospect'> = {};
  const sortedSpeakers = Object.entries(speakerScores).sort(([, a], [, b]) => b - a);

  if (sortedSpeakers.length >= 2) {
    mapping[sortedSpeakers[0][0]] = 'rep';
    mapping[sortedSpeakers[1][0]] = 'prospect';
    sortedSpeakers.slice(2).forEach(([speaker]) => {
      mapping[speaker] = 'prospect';
    });
  } else if (sortedSpeakers.length === 1) {
    mapping[sortedSpeakers[0][0]] = 'rep';
  }

  return mapping;
}

/**
 * Detect speaker from content when no label is available
 */
function detectSpeakerFromContent(text: string, lastSpeaker: 'rep' | 'prospect'): 'rep' | 'prospect' {
  let repScore = 0;
  let prospectScore = 0;

  // Quick rep indicators
  if (/\b(my name is|i'm .* from|our (company|service|program))/i.test(text)) {
    repScore += 3;
  }
  if (/\b(we (offer|provide|can)|let me (explain|show))/i.test(text)) {
    repScore += 2;
  }
  if (/\b(payment|pricing|\$\d+|sign up|schedule|enroll)/i.test(text)) {
    repScore += 2;
  }
  if (/\b(great question|absolutely|definitely|exactly)/i.test(text)) {
    repScore += 1;
  }

  // Quick prospect indicators
  if (/\b(my (son|daughter|child|kid|husband|wife))/i.test(text)) {
    prospectScore += 3;
  }
  if (/\b(how much|what's the (cost|price)|can i afford)/i.test(text)) {
    prospectScore += 2;
  }
  if (/\b(let me (think|talk|check)|i('ll| will) get back)/i.test(text)) {
    prospectScore += 2;
  }
  if (/\?$/.test(text.trim())) {
    prospectScore += 1; // Questions more common from prospects
  }

  // If scores are equal or both zero, alternate from last speaker
  if (repScore === prospectScore) {
    return lastSpeaker === 'rep' ? 'prospect' : 'rep';
  }

  return repScore > prospectScore ? 'rep' : 'prospect';
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
    // Use the existing transcribe endpoint
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
