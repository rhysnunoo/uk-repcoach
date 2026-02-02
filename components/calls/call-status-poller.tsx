'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CallStatusPollerProps {
  callId: string;
  status: string;
}

const SCORING_PHASES = [
  { id: 'opening', label: 'Opening' },
  { id: 'clarify', label: 'Clarify' },
  { id: 'label', label: 'Label' },
  { id: 'overview', label: 'Overview' },
  { id: 'sell', label: 'Sell Vacation' },
  { id: 'price', label: 'Pricing' },
  { id: 'explain', label: 'Objections' },
  { id: 'close', label: 'Close' },
];

export function CallStatusPoller({ callId, status }: CallStatusPollerProps) {
  const router = useRouter();
  const [dots, setDots] = useState('');
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    // Only poll if status is pending, transcribing, or scoring
    if (!['pending', 'transcribing', 'scoring'].includes(status)) {
      return;
    }

    // Animate dots
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    // Poll for status updates every 3 seconds
    const pollInterval = setInterval(() => {
      router.refresh();
    }, 3000);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(pollInterval);
    };
  }, [status, callId, router]);

  // Simulate progress through scoring phases
  useEffect(() => {
    if (status !== 'scoring') return;

    const expectedDuration = 40000; // ~40 seconds for scoring
    const phaseCount = SCORING_PHASES.length;

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / expectedDuration) * 100, 95);
      setProgress(pct);

      // Update current phase based on progress
      const phaseIndex = Math.min(
        Math.floor((elapsed / expectedDuration) * phaseCount),
        phaseCount - 1
      );
      setCurrentPhaseIndex(phaseIndex);
    }, 200);

    return () => clearInterval(progressInterval);
  }, [status, startTime]);

  if (!['pending', 'transcribing', 'scoring'].includes(status)) {
    return null;
  }

  const messages: Record<string, { title: string; detail: string }> = {
    pending: {
      title: 'Uploading',
      detail: 'Your file is being uploaded to secure storage',
    },
    transcribing: {
      title: 'Transcribing',
      detail: 'Converting audio to text using AI (this may take 2-5 minutes for longer calls)',
    },
    scoring: {
      title: 'Analyzing',
      detail: `Scoring: ${SCORING_PHASES[currentPhaseIndex]?.label || 'Processing'}...`,
    },
  };

  const message = messages[status] || messages.pending;

  return (
    <div className="bg-blue-50 border border-blue-200 p-4">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-medium text-blue-800">
            {message.title}{dots}
          </p>
          <p className="text-sm text-blue-600 mt-1">
            {message.detail}
          </p>
        </div>
      </div>

      {/* Progress bar for scoring */}
      {status === 'scoring' && (
        <div className="mt-3">
          <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Phase indicators */}
          <div className="mt-2 flex flex-wrap gap-1">
            {SCORING_PHASES.map((phase, idx) => (
              <span
                key={phase.id}
                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                  idx < currentPhaseIndex
                    ? 'bg-blue-600 text-white'
                    : idx === currentPhaseIndex
                    ? 'bg-blue-300 text-blue-900'
                    : 'bg-blue-100 text-blue-400'
                }`}
              >
                {phase.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-blue-500 mt-3">
        This page will update automatically when processing completes.
      </p>
    </div>
  );
}
