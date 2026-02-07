import type { TranscriptSegment } from '@/types/database';

interface ParsedRingoverLine {
  timestamp: string;
  speaker: string;
  text: string;
  seconds: number;
}

/**
 * Parse a Ringover transcript export file
 *
 * Format 1 (older): HH:MM - Speaker Name - "Text"
 * Example: 00:02 - George Bier - "Good evening. Am I speaking with Chica?"
 *
 * Format 2 (newer):
 *   <timestamp> - <Speaker Name>
 *   <Text on next line>
 * Example:
 *   5s - George Bier
 *   Hey, how are you?
 */
export function parseRingoverTranscript(content: string): {
  segments: TranscriptSegment[];
  repName: string | null;
  prospectIdentifier: string | null;
  duration: number;
} {
  const lines = content.trim().split('\n');
  let parsedLines: ParsedRingoverLine[] = [];

  // Try Format 1 first: HH:MM - Speaker - "Text"
  const format1Pattern = /^(\d{2}:\d{2})\s*-\s*([^-]+?)\s*-\s*"(.+)"$/;

  for (const line of lines) {
    const match = line.match(format1Pattern);
    if (match) {
      const [, timestamp, speaker, text] = match;
      const [mins, secs] = timestamp.split(':').map(Number);
      parsedLines.push({
        timestamp,
        speaker: speaker.trim(),
        text: text.trim(),
        seconds: mins * 60 + secs,
      });
    }
  }

  // If Format 1 didn't work, try Format 2: timestamp line then text line
  let mainAgentFromHeader: string | null = null;
  if (parsedLines.length === 0) {
    const result = parseFormat2(lines);
    parsedLines = result.parsedLines;
    mainAgentFromHeader = result.mainAgent;
  }

  if (parsedLines.length === 0) {
    throw new Error('No valid transcript lines found. Check the file format.');
  }

  // Identify rep vs prospect
  const speakers = [...new Set(parsedLines.map(l => l.speaker))];
  const isPhoneNumber = (s: string) => /^\+?\d[\d\s-]{6,}$/.test(s.replace(/\s/g, ''));

  let repName: string | null = null;
  let prospectIdentifier: string | null = null;

  // First priority: Use "Main agent:" from file header
  if (mainAgentFromHeader && speakers.includes(mainAgentFromHeader)) {
    repName = mainAgentFromHeader;
    prospectIdentifier = speakers.find(s => s !== repName) || null;
  } else {
    // Second priority: Phone number = prospect, name = rep
    for (const speaker of speakers) {
      if (isPhoneNumber(speaker)) {
        prospectIdentifier = speaker;
      } else if (!repName) {
        repName = speaker;
      } else {
        // Multiple names - use heuristics below
        prospectIdentifier = speaker;
      }
    }
  }

  // Fallback: Use heuristics (who talks more is likely the rep)
  if (speakers.length >= 2 && (!repName || !prospectIdentifier)) {
    const speakerCounts = speakers.map(s => ({
      speaker: s,
      count: parsedLines.filter(l => l.speaker === s).length,
      firstAppearance: parsedLines.findIndex(l => l.speaker === s),
    }));

    // Sort by who talks more
    speakerCounts.sort((a, b) => b.count - a.count);
    if (!repName) repName = speakerCounts[0].speaker;
    if (!prospectIdentifier) prospectIdentifier = speakerCounts.find(s => s.speaker !== repName)?.speaker || null;
  }

  // Convert to TranscriptSegments
  const segments: TranscriptSegment[] = parsedLines.map((line, index) => {
    const isRep = line.speaker === repName;
    const nextLine = parsedLines[index + 1];

    return {
      speaker: isRep ? 'rep' : 'prospect',
      text: line.text,
      start_time: line.seconds,
      end_time: nextLine ? nextLine.seconds : line.seconds + 5, // Estimate end time
    };
  });

  // Calculate total duration
  const lastSegment = segments[segments.length - 1];
  const duration = lastSegment ? lastSegment.end_time : 0;

  return {
    segments,
    repName,
    prospectIdentifier,
    duration,
  };
}

/**
 * Parse Format 2: timestamp/speaker line followed by text line
 *
 * Header lines like:
 *   George Bier - Widelande Bandoh
 *   Start time: Thursday, January 29, 2026 at 11:32:09 AM EST
 *   Total time: 17min 26s
 *   Main agent: George Bier
 *   External user: Widelande Bandoh
 *   Transcription:
 *
 * Then alternating:
 *   5s - Widelande Bandoh
 *   Hi.
 *   7s - George Bier
 *   Hey.
 */
function parseFormat2(lines: string[]): { parsedLines: ParsedRingoverLine[]; mainAgent: string | null } {
  const parsedLines: ParsedRingoverLine[] = [];

  // Pattern for timestamp line: "13s - Speaker Name" or "1m 30s - Speaker Name"
  const timestampPattern = /^(\d+)\s*s\s*-\s*(.+)$/;
  const timestampPatternWithMin = /^(\d+)\s*m(?:in)?\s*(\d+)\s*s?\s*-\s*(.+)$/;

  // First, find where the actual transcript starts (after "Transcription:" header)
  let transcriptStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase();
    // More flexible matching for "Transcription:" line
    if (line.startsWith('transcription') || line.startsWith('transcript')) {
      transcriptStartIndex = i + 1;
      break;
    }
  }

  // If we didn't find "Transcription:", find the first timestamp line
  if (transcriptStartIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (timestampPattern.test(line) || timestampPatternWithMin.test(line)) {
        transcriptStartIndex = i;
        break;
      }
    }
  }

  // If still not found, can't parse
  if (transcriptStartIndex === -1) {
    return { parsedLines: [], mainAgent: null };
  }

  // Extract main agent name from header (lines before transcript start)
  let mainAgent: string | null = null;
  for (let i = 0; i < transcriptStartIndex; i++) {
    const line = lines[i].trim();
    const agentMatch = line.match(/^Main agent:\s*(.+)$/i);
    if (agentMatch) {
      mainAgent = agentMatch[1].trim();
      break;
    }
  }

  // Parse transcript lines - collect timestamp entries with their text
  const entries: { seconds: number; speaker: string; textLines: string[] }[] = [];
  let currentEntry: { seconds: number; speaker: string; textLines: string[] } | null = null;

  for (let i = transcriptStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Try to match timestamp patterns
    let seconds = 0;
    let speaker = '';
    let isTimestampLine = false;

    // Try format with minutes first: "1m 30s - Speaker"
    let match = line.match(timestampPatternWithMin);
    if (match) {
      seconds = parseInt(match[1]) * 60 + parseInt(match[2]);
      speaker = match[3].trim();
      isTimestampLine = true;
    } else {
      // Try simple format: "13s - Speaker"
      match = line.match(timestampPattern);
      if (match) {
        seconds = parseInt(match[1]);
        speaker = match[2].trim();
        isTimestampLine = true;
      }
    }

    if (isTimestampLine && speaker) {
      // Save previous entry if exists and has text
      if (currentEntry && currentEntry.textLines.length > 0) {
        entries.push(currentEntry);
      }
      // Start new entry
      currentEntry = { seconds, speaker, textLines: [] };
    } else if (currentEntry) {
      // This is text content for the current speaker
      // Skip lines that look like headers (contain ":" followed by descriptive text)
      if (!line.includes('Main agent:') &&
          !line.includes('External user:') &&
          !line.includes('Start time:') &&
          !line.includes('Total time:')) {
        currentEntry.textLines.push(line);
      }
    }
  }

  // Don't forget the last entry
  if (currentEntry && currentEntry.textLines.length > 0) {
    entries.push(currentEntry);
  }

  // Convert entries to parsed lines
  for (const entry of entries) {
    parsedLines.push({
      timestamp: formatSeconds(entry.seconds),
      speaker: entry.speaker,
      text: entry.textLines.join(' '),
      seconds: entry.seconds,
    });
  }

  return { parsedLines, mainAgent };
}

/**
 * Parse time string like "5s", "1m 30s", "1min 5s", "90s"
 */
function parseTimeString(timeStr: string): number {
  // Remove any trailing 's' if it's standalone
  const cleaned = timeStr.toLowerCase().trim();

  // Try pattern: "1m 30s" or "1min 30s"
  const minSecMatch = cleaned.match(/(\d+)m(?:in)?\s*(\d+)s?/);
  if (minSecMatch) {
    return parseInt(minSecMatch[1]) * 60 + parseInt(minSecMatch[2]);
  }

  // Try pattern: "90s" or "90"
  const secMatch = cleaned.match(/^(\d+)s?$/);
  if (secMatch) {
    return parseInt(secMatch[1]);
  }

  return 0;
}

/**
 * Format seconds as MM:SS
 */
function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Extract metadata from Ringover filename
 * Format: log_call_export_2026-01-28T16_52_31.942Z_11227494775266286233_EN.txt
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
