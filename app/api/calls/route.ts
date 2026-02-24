import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import OpenAI from 'openai';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile to check role
    const { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const isManager = profile?.role === 'manager' || profile?.role === 'admin';

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query = adminClient
      .from('calls')
      .select('id, contact_name, call_date, status, error_message, transcript')
      .order('call_date', { ascending: false })
      .limit(limit);

    // Non-managers can only see their own calls
    if (!isManager) {
      query = query.eq('rep_id', user.id);
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: calls, error } = await query;

    if (error) {
      console.error('Error fetching calls:', error);
      return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
    }

    // Transform to include has_transcript flag
    const transformedCalls = (calls || []).map(call => ({
      id: call.id,
      contact_name: call.contact_name,
      call_date: call.call_date,
      status: call.status,
      error_message: call.error_message,
      has_transcript: !!call.transcript && Array.isArray(call.transcript) && call.transcript.length > 0,
    }));

    return NextResponse.json({ calls: transformedCalls });
  } catch (error) {
    console.error('GET /api/calls error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const mode = (formData.get('mode') as string) || 'audio';
    const scriptId = formData.get('scriptId') as string | null;
    const contactName = formData.get('contactName') as string;
    const callDate = formData.get('callDate') as string;
    const repIdFromForm = formData.get('repId') as string | null;

    const adminClient = createAdminClient();

    // Determine which rep this call belongs to
    let repId = user.id;

    // If a different rep was specified, verify the user is a manager/admin
    if (repIdFromForm && repIdFromForm !== user.id) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'manager' || profile?.role === 'admin') {
        // Verify the target rep exists
        const { data: targetRep } = await adminClient
          .from('profiles')
          .select('id')
          .eq('id', repIdFromForm)
          .single();

        if (targetRep) {
          repId = repIdFromForm;
        } else {
          return NextResponse.json({ error: 'Selected rep not found' }, { status: 400 });
        }
      } else {
        return NextResponse.json(
          { error: 'Only managers can upload calls for other reps' },
          { status: 403 }
        );
      }
    }

    // Handle transcript mode
    if (mode === 'transcript') {
      const transcriptText = formData.get('transcript') as string;

      if (!transcriptText || !transcriptText.trim()) {
        return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
      }

      // Parse transcript into segments
      const transcript = parseTranscript(transcriptText);

      // Auto-detect script from transcript content if not provided
      let detectedScriptId = scriptId;
      if (!detectedScriptId) {
        detectedScriptId = await detectScriptFromTranscript(transcriptText, adminClient);
      }

      // Create call record with transcript
      const { data: call, error: insertError } = await adminClient
        .from('calls')
        .insert({
          rep_id: repId,
          script_id: detectedScriptId,
          source: 'manual',
          status: 'scoring',
          transcript,
          call_date: callDate || new Date().toISOString(),
          contact_name: contactName || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create call record' },
          { status: 500 }
        );
      }

      // Trigger scoring directly
      scoreCallDirect(call.id);

      return NextResponse.json({ callId: call.id, message: 'Transcript processed successfully' });
    }

    // Handle audio mode (existing behavior)
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mp4', 'audio/x-m4a'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|mp4)$/i)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload MP3, WAV, M4A, or MP4.' },
        { status: 400 }
      );
    }

    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB.' },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage (organize by rep, not uploader)
    const fileName = `${repId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await adminClient.storage
      .from('call-recordings')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // For audio uploads, we'll detect script after transcription
    // For now, use null and detect later
    const { data: call, error: insertError } = await adminClient
      .from('calls')
      .insert({
        rep_id: repId,
        script_id: scriptId || null,
        source: 'manual',
        status: 'pending',
        storage_path: fileName,
        call_date: callDate || new Date().toISOString(),
        contact_name: contactName || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create call record' },
        { status: 500 }
      );
    }

    // Start async processing
    processCallAsync(call.id, fileName);

    return NextResponse.json({ callId: call.id, message: 'Upload successful' });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processCallAsync(callId: string, storagePath: string) {
  const adminClient = createAdminClient();

  console.log(`[processCallAsync] Starting processing for call ${callId}, path: ${storagePath}`);

  try {
    // Update status to transcribing
    await adminClient
      .from('calls')
      .update({ status: 'transcribing' })
      .eq('id', callId);
    console.log(`[processCallAsync] Status updated to transcribing`);

    // Download file from storage
    console.log(`[processCallAsync] Downloading file from storage...`);
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from('call-recordings')
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error(`[processCallAsync] Download error:`, downloadError);
      throw new Error('Failed to download file for transcription');
    }
    console.log(`[processCallAsync] File downloaded, size: ${fileData.size} bytes`);

    let transcript: { speaker: 'rep' | 'prospect'; text: string; start_time: number; end_time: number }[];
    let durationSeconds: number | null = null;

    // Use OpenAI Whisper for transcription
    console.log(`[processCallAsync] Using Whisper transcription...`);
    const transcriptionResponse = await getOpenAI().audio.transcriptions.create({
      file: new File([fileData], 'audio.mp3', { type: 'audio/mpeg' }),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });
    console.log(`[processCallAsync] Whisper transcription complete, duration: ${transcriptionResponse.duration}s`);

    // Parse transcript into segments with speaker inference (heuristic-based)
    transcript = inferSpeakers(transcriptionResponse);
    durationSeconds = transcriptionResponse.duration
      ? Math.round(transcriptionResponse.duration)
      : null;
    console.log(`[processCallAsync] Parsed ${transcript.length} transcript segments using heuristic speaker detection`);

    // Update with transcript
    await adminClient
      .from('calls')
      .update({
        status: 'scoring',
        transcript,
        duration_seconds: durationSeconds,
      })
      .eq('id', callId);
    console.log(`[processCallAsync] Transcript saved, triggering scoring...`);

    // Trigger scoring
    await scoreCallDirect(callId);
    console.log(`[processCallAsync] Processing complete for call ${callId}`);
  } catch (error) {
    console.error('[processCallAsync] Processing error:', error);
    await adminClient
      .from('calls')
      .update({
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Processing failed',
      })
      .eq('id', callId);
  }
}

interface WhisperSegment {
  start: number;
  end: number;
  text: string;
}

interface WhisperResponse {
  segments?: WhisperSegment[];
  text?: string;
  duration?: number;
}

function inferSpeakers(transcription: WhisperResponse): { speaker: 'rep' | 'prospect'; text: string; start_time: number; end_time: number }[] {
  const segments = transcription.segments || [];

  if (segments.length === 0) {
    // Fallback: split by sentences
    const text = transcription.text || '';
    const sentences = text.split(/(?<=[.!?])\s+/);
    return sentences.map((sentence, index) => ({
      speaker: (index % 2 === 0 ? 'rep' : 'prospect') as 'rep' | 'prospect',
      text: sentence.trim(),
      start_time: 0,
      end_time: 0,
    }));
  }

  // Simple heuristic: alternate speakers based on pauses
  // If there's a significant pause (>1.5s), assume speaker change
  const pauseThreshold = 1.5;
  let currentSpeaker: 'rep' | 'prospect' = 'rep'; // Assume rep starts

  return segments.map((segment, index) => {
    if (index > 0) {
      const prevEnd = segments[index - 1].end;
      const pause = segment.start - prevEnd;
      if (pause > pauseThreshold) {
        currentSpeaker = currentSpeaker === 'rep' ? 'prospect' : 'rep';
      }
    }

    return {
      speaker: currentSpeaker,
      text: segment.text.trim(),
      start_time: segment.start,
      end_time: segment.end,
    };
  });
}

function parseTranscript(text: string) {
  // Split into lines
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Aircall format patterns:
  // [00:01] John (Agent): Hello...
  // 00:01 Agent: Hello...
  // [0:01] Speaker 1: Hello...
  const aircallPattern = /^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*(?:([^:(]+)\s*\(([^)]+)\)|([^:]+)):\s*(.+)$/i;

  // Standard label pattern (no timestamp)
  const labelPattern = /^(REP|PROSPECT|PARENT|AGENT|CUSTOMER|CALLER|SPEAKER\s*\d*|SPEAKER\s*[AB]|USER|ASSISTANT):\s*/i;

  // Check if this looks like Aircall format (has timestamps)
  const hasAircallFormat = lines.some(line => aircallPattern.test(line));

  if (hasAircallFormat) {
    console.log('[parseTranscript] Detected Aircall format');
    const rawSegments: { label: string; text: string; timestamp: number }[] = [];

    for (const line of lines) {
      const match = line.match(aircallPattern);
      if (match) {
        const timeStr = match[1];
        const speakerName = match[2]?.trim() || match[4]?.trim() || '';
        const speakerRole = match[3]?.trim() || ''; // e.g., "Agent" or "Customer"
        const content = match[5]?.trim() || '';

        // Parse timestamp to seconds
        const timeParts = timeStr.split(':').map(Number);
        let seconds = 0;
        if (timeParts.length === 2) {
          seconds = timeParts[0] * 60 + timeParts[1];
        } else if (timeParts.length === 3) {
          seconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
        }

        // Combine name and role for label
        const label = speakerRole || speakerName || 'UNKNOWN';

        if (content) {
          rawSegments.push({ label: label.toUpperCase(), text: content, timestamp: seconds });
        }
      } else {
        // Line without match - append to previous segment
        if (rawSegments.length > 0) {
          rawSegments[rawSegments.length - 1].text += ' ' + line;
        }
      }
    }

    // Determine speaker mapping
    const speakerMapping = determineSpeakerMapping(rawSegments);

    return rawSegments.map((segment, index) => ({
      speaker: speakerMapping[segment.label] || (index % 2 === 0 ? 'rep' : 'prospect') as 'rep' | 'prospect',
      text: segment.text,
      start_time: segment.timestamp,
      end_time: rawSegments[index + 1]?.timestamp || segment.timestamp,
    }));
  }

  // Check for standard labels
  const hasLabels = lines.some(line => labelPattern.test(line));

  if (hasLabels) {
    console.log('[parseTranscript] Detected standard labeled format');
    const rawSegments: { label: string; text: string }[] = [];

    for (const line of lines) {
      const match = line.match(labelPattern);
      if (match) {
        const label = match[1].toUpperCase().replace(/\s+/g, ' ').trim();
        const content = line.replace(labelPattern, '').trim();

        if (content) {
          rawSegments.push({ label, text: content });
        }
      } else {
        // Line without label - append to previous segment if exists
        if (rawSegments.length > 0) {
          rawSegments[rawSegments.length - 1].text += ' ' + line;
        }
      }
    }

    // Determine speaker mapping
    const speakerMapping = determineSpeakerMapping(rawSegments);

    return rawSegments.map((segment, index) => ({
      speaker: speakerMapping[segment.label] || (index % 2 === 0 ? 'rep' : 'prospect') as 'rep' | 'prospect',
      text: segment.text,
      start_time: 0,
      end_time: 0,
    }));
  }

  console.log('[parseTranscript] No labels detected, using alternating speakers');

  // No labels - alternate speakers, assume rep starts
  // But try to detect who starts based on content
  let repStartsFirst = true;

  if (lines.length > 0) {
    const firstLine = lines[0].toLowerCase();
    // If first line sounds like a prospect, swap
    if (/\b(hi|hello|yes|yeah|i('m| am) .*(interested|looking|calling about))\b/i.test(firstLine) &&
        !/\b(this is|calling from|myedspace)\b/i.test(firstLine)) {
      repStartsFirst = false;
    }
  }

  return lines.map((line, index) => ({
    speaker: (index % 2 === 0) === repStartsFirst ? 'rep' as const : 'prospect' as const,
    text: line,
    start_time: 0,
    end_time: 0,
  }));
}

function determineSpeakerMapping(segments: { label: string; text: string }[]): Record<string, 'rep' | 'prospect'> {
  // Rep indicators: company intro, product explanation
  const repIndicators = /\b(this is .* from|calling (you )?from|myedspace|my edspace|i('m| am) calling|we (help|offer|provide)|our (tutors|program|service))\b/i;
  // Prospect indicators: asking about child, expressing interest
  const prospectIndicators = /\b(my (son|daughter|child|kid)|i('m| am) interested|i booked|we('re| are) looking|i need help|tell me about)\b/i;

  // Explicit role labels (high confidence)
  const explicitRepLabels = ['REP', 'AGENT', 'CALLER', 'SALES', 'REPRESENTATIVE', 'ASSISTANT'];
  const explicitProspectLabels = ['PROSPECT', 'PARENT', 'CUSTOMER', 'CLIENT', 'USER', 'LEAD'];

  // Score each unique label
  const labelScores: Record<string, number> = {};

  for (const segment of segments) {
    if (!labelScores[segment.label]) {
      labelScores[segment.label] = 0;
    }

    // Content-based scoring
    if (repIndicators.test(segment.text)) {
      labelScores[segment.label] += 10;
    }
    if (prospectIndicators.test(segment.text)) {
      labelScores[segment.label] -= 10;
    }
  }

  // Apply explicit label bonuses
  for (const label of Object.keys(labelScores)) {
    const normalizedLabel = label.replace(/\d+/g, '').trim();
    if (explicitRepLabels.some(r => normalizedLabel.includes(r))) {
      labelScores[label] += 100;
    }
    if (explicitProspectLabels.some(p => normalizedLabel.includes(p))) {
      labelScores[label] -= 100;
    }
  }

  // Build mapping
  const mapping: Record<string, 'rep' | 'prospect'> = {};
  const labels = Object.keys(labelScores);

  if (labels.length === 0) return mapping;

  // Find the label most likely to be rep
  let repLabel = labels[0];
  let maxScore = labelScores[repLabel];

  for (const label of labels) {
    if (labelScores[label] > maxScore) {
      maxScore = labelScores[label];
      repLabel = label;
    }
  }

  // Assign roles
  for (const label of labels) {
    mapping[label] = label === repLabel ? 'rep' : 'prospect';
  }

  console.log('[determineSpeakerMapping] Label scores:', labelScores);
  console.log('[determineSpeakerMapping] Final mapping:', mapping);

  return mapping;
}

async function scoreCallDirect(callId: string) {
  try {
    const { scoreCall: doScore } = await import('@/lib/scoring/score');
    await doScore(callId);
  } catch (error) {
    console.error('Failed to trigger scoring:', error);
  }
}

async function detectScriptFromTranscript(transcriptText: string, adminClient: ReturnType<typeof createAdminClient>): Promise<string | null> {
  const text = transcriptText.toLowerCase();

  // Keywords for each course
  const courseKeywords: Record<string, string[]> = {
    'Pre-Algebra': ['pre-algebra', 'pre algebra', 'prealgebra', '6th grade', '7th grade', 'middle school math'],
    'Algebra 1': ['algebra 1', 'algebra one', '8th grade', '9th grade', 'freshman'],
    'Geometry': ['geometry', 'proofs', 'triangles', 'geometric'],
    'Algebra 2': ['algebra 2', 'algebra two', 'algebra ii', '10th grade', '11th grade', 'junior'],
  };

  // Count matches for each course
  let bestMatch: string | null = null;
  let highestCount = 0;

  for (const [course, keywords] of Object.entries(courseKeywords)) {
    const count = keywords.filter(keyword => text.includes(keyword)).length;
    if (count > highestCount) {
      highestCount = count;
      bestMatch = course;
    }
  }

  // If we found a match, get the script ID
  if (bestMatch) {
    const { data: script } = await adminClient
      .from('scripts')
      .select('id')
      .eq('course', bestMatch)
      .eq('is_active', true)
      .single();

    if (script) {
      return script.id;
    }
  }

  // Default: get any active script (the CLOSER framework is the same across all)
  const { data: defaultScript } = await adminClient
    .from('scripts')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .single();

  return defaultScript?.id || null;
}
