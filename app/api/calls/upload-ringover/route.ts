import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getProfile } from '@/lib/supabase/server';
import { parseRingoverTranscript, parseRingoverFilename } from '@/lib/ringover/transcript-parser';
import { findDuplicateCall } from '@/lib/utils/deduplication';
import { scoreCall } from '@/lib/scoring/score';

export async function POST(request: NextRequest) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const transcriptFile = formData.get('transcript') as File | null;
    const audioFile = formData.get('audio') as File | null;
    const contactName = formData.get('contactName') as string | null;
    const callDate = formData.get('callDate') as string | null;
    const repId = formData.get('repId') as string | null;

    // Determine which rep to assign the call to
    const assignedRepId = repId || profile.id;

    if (!transcriptFile) {
      return NextResponse.json({ error: 'Transcript file is required' }, { status: 400 });
    }

    // Read and parse the transcript file
    const transcriptContent = await transcriptFile.text();
    const parsed = parseRingoverTranscript(transcriptContent);
    const fileMetadata = parseRingoverFilename(transcriptFile.name);

    const adminClient = createAdminClient();

    // Check for duplicates (e.g., already imported from HubSpot)
    const finalCallDate = callDate || fileMetadata.exportDate?.toISOString() || new Date().toISOString();
    const { isDuplicate, existingCallId } = await findDuplicateCall(adminClient, {
      contactPhone: parsed.prospectIdentifier,
      callDate: finalCallDate,
      durationSeconds: Math.round(parsed.duration),
      excludeSource: 'ringover', // Don't match other Ringover calls
    });

    if (isDuplicate && existingCallId) {
      return NextResponse.json({
        error: 'This call appears to already exist (possibly imported from HubSpot)',
        existingCallId,
        isDuplicate: true,
      }, { status: 409 });
    }

    // Upload audio to storage if provided
    let audioUrl: string | null = null;
    if (audioFile) {
      const audioBuffer = await audioFile.arrayBuffer();
      const audioPath = `calls/${assignedRepId}/${Date.now()}-${audioFile.name}`;

      const { error: uploadError } = await adminClient.storage
        .from('call-recordings')
        .upload(audioPath, audioBuffer, {
          contentType: audioFile.type,
        });

      if (!uploadError) {
        const { data: urlData } = adminClient.storage
          .from('call-recordings')
          .getPublicUrl(audioPath);
        audioUrl = urlData.publicUrl;
      }
    }

    // Create the call record
    const { data: call, error: insertError } = await adminClient
      .from('calls')
      .insert({
        rep_id: assignedRepId,
        contact_name: contactName || parsed.prospectIdentifier || 'Unknown',
        contact_phone: parsed.prospectIdentifier,
        call_date: finalCallDate,
        duration_seconds: Math.round(parsed.duration),
        transcript: parsed.segments,
        audio_url: audioUrl,
        source: 'ringover',
        status: 'scoring', // Ready for scoring since we have transcript
        ringover_call_id: fileMetadata.callId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create call:', insertError);
      return NextResponse.json({ error: 'Failed to create call record' }, { status: 500 });
    }

    // Trigger scoring in background (don't await - let it run async)
    scoreCall(call.id).catch(err => console.error('Failed to score call:', err));

    return NextResponse.json({
      success: true,
      callId: call.id,
      repName: parsed.repName,
      prospectIdentifier: parsed.prospectIdentifier,
      segmentCount: parsed.segments.length,
      duration: parsed.duration,
      parserVersion: 3, // Increment this to verify deployment
    });

  } catch (error) {
    console.error('Ringover upload error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
