import type { TranscriptSegment } from '@/types/database';

interface ParsedSegment {
  speaker: string;
  text: string;
  seconds: number;
}

/**
 * Parse a Ringover transcript export file
 *
 * Expected format:
 *   Name1 - Name2
 *   Start time: ...
 *   Total time: ...
 *
 *   Main agent: Name1
 *   External user: Name2
 *
 *   Transcription:
 *   13s - Name2
 *   Hello?
 *
 *   14s - Name1
 *   Hi there!
 */
export function parseRingoverTranscript(content: string): {
  segments: TranscriptSegment[];
  repName: string | null;
  prospectIdentifier: string | null;
  duration: number;
} {
  const lines = content.split(/\r?\n/);

  // Extract header info
  let mainAgent: string | null = null;
  let externalUser: string | null = null;
  let transcriptStartLine = -1;

  // Find header info and transcript start
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineLower = line.toLowerCase();

    // Extract main agent
    if (lineLower.startsWith('main agent:')) {
      mainAgent = line.substring('main agent:'.length).trim();
    }

    // Extract external user
    if (lineLower.startsWith('external user:')) {
      externalUser = line.substring('external user:'.length).trim();
    }

    // Find transcription start
    if (lineLower.startsWith('transcription')) {
      transcriptStartLine = i + 1;
      break;
    }
  }

  // If no "Transcription:" found, try to find first timestamp line
  if (transcriptStartLine === -1) {
    for (let i = 0; i < lines.length; i++) {
      if (isTimestampLine(lines[i].trim())) {
        transcriptStartLine = i;
        break;
      }
    }
  }

  if (transcriptStartLine === -1) {
    throw new Error('Could not find transcript content. Make sure the file contains "Transcription:" or timestamp lines like "13s - Name".');
  }

  // Parse transcript segments
  const segments: ParsedSegment[] = [];
  let currentSpeaker: string | null = null;
  let currentSeconds = 0;
  let currentTextLines: string[] = [];

  for (let i = transcriptStartLine; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Check if this is a timestamp line
    const timestampInfo = parseTimestampLine(line);

    if (timestampInfo) {
      // Save previous segment if we have one
      if (currentSpeaker && currentTextLines.length > 0) {
        segments.push({
          speaker: currentSpeaker,
          text: currentTextLines.join(' '),
          seconds: currentSeconds,
        });
      }

      // Start new segment
      currentSpeaker = timestampInfo.speaker;
      currentSeconds = timestampInfo.seconds;
      currentTextLines = [];
    } else if (currentSpeaker) {
      // This is text content - add to current segment
      currentTextLines.push(line);
    }
  }

  // Don't forget the last segment
  if (currentSpeaker && currentTextLines.length > 0) {
    segments.push({
      speaker: currentSpeaker,
      text: currentTextLines.join(' '),
      seconds: currentSeconds,
    });
  }

  if (segments.length === 0) {
    throw new Error('No transcript segments found. Check the file format.');
  }

  // Determine who is the rep vs prospect
  const repName = mainAgent;
  const prospectIdentifier = externalUser;

  // Convert to TranscriptSegment format
  const transcriptSegments: TranscriptSegment[] = segments.map((seg, idx) => {
    const isRep = seg.speaker === repName;
    const nextSeg = segments[idx + 1];

    return {
      speaker: isRep ? 'rep' : 'prospect',
      text: seg.text,
      start_time: seg.seconds,
      end_time: nextSeg ? nextSeg.seconds : seg.seconds + 5,
    };
  });

  const lastSegment = transcriptSegments[transcriptSegments.length - 1];
  const duration = lastSegment ? lastSegment.end_time : 0;

  return {
    segments: transcriptSegments,
    repName,
    prospectIdentifier,
    duration,
  };
}

/**
 * Check if a line is a timestamp line like "13s - Speaker Name"
 */
function isTimestampLine(line: string): boolean {
  // Must start with a number, contain 's', then ' - ', then a name
  // Examples: "13s - John", "1m 30s - John", "1min 5s - John"
  return /^\d+.*s\s+-\s+\S/.test(line);
}

/**
 * Parse a timestamp line like "13s - Speaker Name" or "1m 30s - Speaker"
 */
function parseTimestampLine(line: string): { speaker: string; seconds: number } | null {
  // Pattern: number(s/m/min) - Name
  // Examples: "13s - John Smith", "1m 30s - John Smith"

  // Try to match: starts with digits, has 's' somewhere before ' - ', then speaker name
  const match = line.match(/^(\d+(?:\s*m(?:in)?\s*\d+)?)\s*s\s+-\s+(.+)$/);

  if (!match) {
    return null;
  }

  const timeStr = match[1];
  const speaker = match[2].trim();

  // Parse the time
  let seconds = 0;

  // Check for minutes: "1m 30" or "1min 30"
  const minMatch = timeStr.match(/(\d+)\s*m(?:in)?\s*(\d+)/);
  if (minMatch) {
    seconds = parseInt(minMatch[1]) * 60 + parseInt(minMatch[2]);
  } else {
    // Just seconds
    seconds = parseInt(timeStr);
  }

  return { speaker, seconds };
}

/**
 * Extract metadata from Ringover filename
 */
export function parseRingoverFilename(filename: string): {
  exportDate: Date | null;
  callId: string | null;
  language: string | null;
} {
  const pattern = /log_call_export_(\d{4}-\d{2}-\d{2}T[\d_]+\.\d+Z)_(\d+)_([A-Z]{2})\./;
  const match = filename.match(pattern);

  if (!match) {
    return { exportDate: null, callId: null, language: null };
  }

  const [, dateStr, callId, language] = match;
  const exportDate = new Date(dateStr.replace(/_/g, ':').replace(':942Z', '.942Z'));

  return {
    exportDate: isNaN(exportDate.getTime()) ? null : exportDate,
    callId,
    language,
  };
}
