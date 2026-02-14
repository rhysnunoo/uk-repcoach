import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { transcribeWithWhisper } from '@/lib/openai/transcribe';
import { findDuplicateCall } from '@/lib/utils/deduplication';

/**
 * Ringover Webhook Endpoint
 *
 * Receives call notifications from Ringover when calls end.
 * Downloads the recording, transcribes with Whisper, and creates the call record.
 *
 * Ringover webhook payload (call.ended event):
 * {
 *   "event": "call.ended",
 *   "data": {
 *     "call_id": "123456",
 *     "direction": "outbound",
 *     "duration": 300,
 *     "started_at": "2024-01-15T10:00:00Z",
 *     "ended_at": "2024-01-15T10:05:00Z",
 *     "recording_url": "https://...",
 *     "user": {
 *       "id": "user_123",
 *       "name": "John Doe",
 *       "email": "john@example.com"
 *     },
 *     "contact": {
 *       "number": "+1234567890",
 *       "name": "Jane Smith"
 *     }
 *   }
 * }
 */

interface RingoverWebhookPayload {
  event: string;
  data: {
    call_id: string;
    direction: 'inbound' | 'outbound';
    duration: number;
    started_at: string;
    ended_at: string;
    recording_url?: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
    contact?: {
      number: string;
      name?: string;
      // CRM integration fields (when Ringover is connected to HubSpot)
      hubspot_contact_id?: string;
      hubspot_id?: string;
      crm_id?: string;
      external_id?: string;
    };
    // Some Ringover integrations put CRM data at root level
    hubspot_contact_id?: string;
    crm_contact_id?: string;
    raw_digits?: string;
    status?: string;
  };
}

// Minimum call duration to process (60 seconds)
const MIN_DURATION_SECONDS = 60;

export async function POST(request: NextRequest) {
  console.log('[Ringover Webhook] Received request');

  try {
    // Verify webhook secret if configured
    // Verify via header only (never accept secrets in query strings — they leak in logs)
    const webhookSecret = process.env.RINGOVER_WEBHOOK_SECRET;
    if (webhookSecret) {
      const headerSecret = request.headers.get('x-webhook-secret') ||
                           request.headers.get('authorization')?.replace('Bearer ', '');

      if (headerSecret !== webhookSecret) {
        console.log('[Ringover Webhook] Invalid or missing secret');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const payload: RingoverWebhookPayload = await request.json();
    console.log('[Ringover Webhook] Event:', payload.event);
    console.log('[Ringover Webhook] Contact data:', JSON.stringify(payload.data.contact, null, 2));

    // Only process call.ended events
    if (payload.event !== 'call.ended' && payload.event !== 'call_ended') {
      console.log('[Ringover Webhook] Ignoring event:', payload.event);
      return NextResponse.json({ status: 'ignored', reason: 'Not a call ended event' });
    }

    const callData = payload.data;

    // Skip short calls
    if (callData.duration < MIN_DURATION_SECONDS) {
      console.log('[Ringover Webhook] Skipping short call:', callData.duration, 'seconds');
      return NextResponse.json({ status: 'skipped', reason: 'Call too short' });
    }

    // Skip calls without recording
    if (!callData.recording_url) {
      console.log('[Ringover Webhook] Skipping call without recording');
      return NextResponse.json({ status: 'skipped', reason: 'No recording available' });
    }

    const adminClient = createAdminClient();

    // Check if call already exists
    const { data: existingCall } = await adminClient
      .from('calls')
      .select('id')
      .eq('ringover_call_id', callData.call_id)
      .single();

    if (existingCall) {
      console.log('[Ringover Webhook] Call already exists:', existingCall.id);
      return NextResponse.json({ status: 'skipped', reason: 'Call already exists' });
    }

    // Find rep by Ringover user ID or email
    let repId: string | null = null;

    if (callData.user) {
      // Try to find by ringover_user_id first
      const { data: profileByRingoverId } = await adminClient
        .from('profiles')
        .select('id')
        .eq('ringover_user_id', callData.user.id)
        .single();

      if (profileByRingoverId) {
        repId = profileByRingoverId.id;
      } else {
        // Try to find by email
        const { data: profileByEmail } = await adminClient
          .from('profiles')
          .select('id')
          .eq('email', callData.user.email)
          .single();

        if (profileByEmail) {
          repId = profileByEmail.id;
        }
      }
    }

    if (!repId) {
      console.log('[Ringover Webhook] No matching rep found for user:', callData.user?.email);
      return NextResponse.json({ status: 'skipped', reason: 'No matching rep found' });
    }

    // Check for duplicates from other sources (e.g., HubSpot)
    const contactPhone = callData.contact?.number || callData.raw_digits || null;
    const callDate = callData.started_at || new Date().toISOString();

    const { isDuplicate, existingCallId } = await findDuplicateCall(adminClient, {
      contactPhone,
      callDate,
      durationSeconds: callData.duration,
      excludeSource: 'ringover',
    });

    if (isDuplicate) {
      console.log('[Ringover Webhook] Duplicate call found:', existingCallId);
      return NextResponse.json({
        status: 'skipped',
        reason: 'Duplicate call found',
        existingCallId,
      });
    }

    // Extract HubSpot contact ID if available (from CRM integration)
    const hubspotContactId = callData.hubspot_contact_id ||
      callData.crm_contact_id ||
      callData.contact?.hubspot_contact_id ||
      callData.contact?.hubspot_id ||
      callData.contact?.crm_id ||
      callData.contact?.external_id ||
      null;

    // Create call record with 'transcribing' status
    const { data: newCall, error: insertError } = await adminClient
      .from('calls')
      .insert({
        rep_id: repId,
        source: 'ringover',
        status: 'transcribing',
        ringover_call_id: callData.call_id,
        recording_url: callData.recording_url,
        duration_seconds: callData.duration,
        call_date: callDate,
        contact_name: callData.contact?.name || contactPhone || 'Unknown',
        contact_phone: contactPhone,
        hubspot_contact_id: hubspotContactId,
      })
      .select()
      .single();

    if (insertError || !newCall) {
      console.error('[Ringover Webhook] Failed to create call:', insertError);
      return NextResponse.json({ error: 'Failed to create call' }, { status: 500 });
    }

    console.log('[Ringover Webhook] Created call:', newCall.id);

    // Transcribe asynchronously (don't wait for completion)
    processCallTranscription(newCall.id, callData.recording_url).catch(err => {
      console.error('[Ringover Webhook] Transcription failed:', err);
    });

    return NextResponse.json({
      status: 'processing',
      callId: newCall.id,
      message: 'Call created, transcription in progress',
    });

  } catch (error) {
    console.error('[Ringover Webhook] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Process call transcription asynchronously
 */
async function processCallTranscription(callId: string, recordingUrl: string) {
  const adminClient = createAdminClient();

  try {
    console.log('[Ringover Webhook] Starting transcription for call:', callId);

    // Transcribe with Whisper
    const result = await transcribeWithWhisper(recordingUrl, {
      prompt: 'This is a sales call between a sales representative and a prospect.',
    });

    console.log('[Ringover Webhook] Transcription complete:', result.segments.length, 'segments');

    // Update call with transcript
    const { error: updateError } = await adminClient
      .from('calls')
      .update({
        transcript: result.segments,
        status: 'scoring',
      })
      .eq('id', callId);

    if (updateError) {
      throw updateError;
    }

    // Trigger scoring directly (avoid self-fetch anti-pattern)
    const { scoreCall } = await import('@/lib/scoring/score');
    await scoreCall(callId);

    console.log('[Ringover Webhook] Scoring triggered for call:', callId);

  } catch (error) {
    console.error('[Ringover Webhook] Transcription error for call:', callId, error);

    // Update call status to indicate failure
    await adminClient
      .from('calls')
      .update({
        status: 'error',
        error_message: 'Transcription failed',
      })
      .eq('id', callId);
  }
}

// Also handle GET for webhook verification (some services send a verification request)
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge');
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  return NextResponse.json({ status: 'Ringover webhook endpoint active' });
}
