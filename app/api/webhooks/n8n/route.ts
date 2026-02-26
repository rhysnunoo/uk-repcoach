import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { transcribeWithWhisper } from '@/lib/openai/transcribe';
import { findDuplicateCall } from '@/lib/utils/deduplication';

/**
 * n8n Webhook Endpoint for Bitrix24 Calls
 *
 * Receives call data from n8n after Bitrix24 ONVOXIMPLANTCALLEND events.
 * n8n workflow: Bitrix webhook → voximplant.statistic.get → POST here
 *
 * Expected payload:
 * {
 *   "bitrix_call_id": "B9BFD70DA12F0DDB.1771603483.5082927",
 *   "bitrix_user_id": "86982",
 *   "phone_number": "447547413331",
 *   "duration_seconds": 1612,
 *   "call_date": "2026-02-20T16:04:44+00:00",
 *   "recording_url": "https://...",
 *   "call_type": "outbound" | "inbound"
 * }
 */

interface N8nWebhookPayload {
  bitrix_call_id: string;
  bitrix_user_id: string;
  phone_number?: string;
  duration_seconds: number;
  call_date: string;
  recording_url: string;
  call_type?: string;
}

// Minimum call duration to process (10 seconds)
const MIN_DURATION_SECONDS = 10;

export async function POST(request: NextRequest) {
  console.log('[n8n Webhook] Received request');

  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET;
    if (webhookSecret) {
      const headerSecret = request.headers.get('x-webhook-secret') ||
                           request.headers.get('authorization')?.replace('Bearer ', '');

      if (headerSecret !== webhookSecret) {
        console.log('[n8n Webhook] Invalid or missing secret');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    let payload: N8nWebhookPayload;
    try {
      payload = await request.json();
    } catch {
      console.error('[n8n Webhook] Invalid or empty JSON body');
      return NextResponse.json(
        { error: 'Invalid or empty JSON body. Ensure Content-Type is application/json and body is valid JSON.' },
        { status: 400 }
      );
    }

    console.log('[n8n Webhook] Payload:', JSON.stringify({
      bitrix_call_id: payload.bitrix_call_id,
      bitrix_user_id: payload.bitrix_user_id,
      duration_seconds: payload.duration_seconds,
      call_type: payload.call_type,
    }));

    // Validate required fields
    if (!payload.bitrix_call_id || !payload.bitrix_user_id || !payload.recording_url) {
      return NextResponse.json(
        { error: 'Missing required fields: bitrix_call_id, bitrix_user_id, recording_url' },
        { status: 400 }
      );
    }

    // Skip short calls
    if (payload.duration_seconds < MIN_DURATION_SECONDS) {
      console.log('[n8n Webhook] Skipping short call:', payload.duration_seconds, 'seconds');
      return NextResponse.json({ status: 'skipped', reason: 'Call too short' });
    }

    const adminClient = createAdminClient();

    // Check if call already exists (dedup by bitrix_call_id)
    const { data: existingCall } = await adminClient
      .from('calls')
      .select('id')
      .eq('bitrix_call_id', payload.bitrix_call_id)
      .single();

    if (existingCall) {
      console.log('[n8n Webhook] Call already exists:', existingCall.id);
      return NextResponse.json({ status: 'skipped', reason: 'Call already exists' });
    }

    // Find rep by bitrix_user_id
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, full_name')
      .eq('bitrix_user_id', payload.bitrix_user_id)
      .single();

    if (!profile) {
      console.log('[n8n Webhook] No matching rep for bitrix_user_id:', payload.bitrix_user_id);
      return NextResponse.json({ status: 'skipped', reason: 'No matching rep found' });
    }

    console.log('[n8n Webhook] Matched rep:', profile.full_name, '(', profile.id, ')');

    // Check for duplicates from other sources
    const callDate = payload.call_date || new Date().toISOString();
    const { isDuplicate, existingCallId } = await findDuplicateCall(adminClient, {
      contactPhone: payload.phone_number || null,
      callDate,
      durationSeconds: payload.duration_seconds,
      excludeSource: 'bitrix',
    });

    if (isDuplicate) {
      console.log('[n8n Webhook] Duplicate call found:', existingCallId);
      return NextResponse.json({ status: 'skipped', reason: 'Duplicate call', existingCallId });
    }

    // Create call record
    const { data: newCall, error: insertError } = await adminClient
      .from('calls')
      .insert({
        rep_id: profile.id,
        source: 'bitrix',
        status: 'transcribing',
        bitrix_call_id: payload.bitrix_call_id,
        recording_url: payload.recording_url,
        duration_seconds: payload.duration_seconds,
        call_date: callDate,
        contact_phone: payload.phone_number || null,
        contact_name: payload.phone_number || 'Unknown',
      })
      .select()
      .single();

    if (insertError || !newCall) {
      console.error('[n8n Webhook] Failed to create call:', insertError);
      return NextResponse.json({ error: 'Failed to create call' }, { status: 500 });
    }

    console.log('[n8n Webhook] Created call:', newCall.id);

    // Process asynchronously: transcribe → score
    processCall(newCall.id, payload.recording_url).catch(err => {
      console.error('[n8n Webhook] Processing failed:', err);
    });

    return NextResponse.json({
      status: 'processing',
      callId: newCall.id,
      message: 'Call created, transcription and scoring in progress',
    });

  } catch (error) {
    console.error('[n8n Webhook] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Download recording, transcribe with Whisper, then score against CLOSER framework
 */
async function processCall(callId: string, recordingUrl: string) {
  const adminClient = createAdminClient();

  try {
    console.log('[n8n Webhook] Transcribing call:', callId);

    // Transcribe with Whisper
    const result = await transcribeWithWhisper(recordingUrl, {
      prompt: 'This is a sales call between a sales representative and a prospect about tutoring services.',
    });

    console.log('[n8n Webhook] Transcription complete:', result.segments.length, 'segments,', result.duration, 'seconds');

    // Save transcript
    await adminClient
      .from('calls')
      .update({
        transcript: result.segments,
        status: 'scoring',
        duration_seconds: Math.round(result.duration) || undefined,
      })
      .eq('id', callId);

    // Score against CLOSER framework
    const { scoreCall } = await import('@/lib/scoring/score');
    await scoreCall(callId);

    console.log('[n8n Webhook] Scoring complete for call:', callId);

  } catch (error) {
    console.error('[n8n Webhook] Processing error for call:', callId, error);

    await adminClient
      .from('calls')
      .update({
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Processing failed',
      })
      .eq('id', callId);
  }
}

// GET for health check
export async function GET() {
  return NextResponse.json({ status: 'n8n webhook endpoint active' });
}
