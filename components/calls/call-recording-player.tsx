'use client';

import { useState } from 'react';
import { AudioPlayer } from './audio-player';
import { TranscriptViewer } from './transcript-viewer';
import type { TranscriptSegment } from '@/types/database';

interface CallRecordingPlayerProps {
  recordingUrl: string | null;
  transcript: TranscriptSegment[];
}

export function CallRecordingPlayer({ recordingUrl, transcript }: CallRecordingPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);

  const hasAudio = !!recordingUrl;

  return (
    <div className="space-y-4">
      {/* Audio Player */}
      {hasAudio && (
        <div className="sticky top-0 z-10 bg-white pb-4">
          <AudioPlayer
            src={recordingUrl}
            onTimeUpdate={setCurrentTime}
          />
        </div>
      )}

      {/* Transcript */}
      <TranscriptViewer
        transcript={transcript}
        currentAudioTime={hasAudio ? currentTime : undefined}
        hasAudio={hasAudio}
      />
    </div>
  );
}
