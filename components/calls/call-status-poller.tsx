'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CallStatusPollerProps {
  callId: string;
  status: string;
  durationSeconds?: number | null;
}

const STEPS = [
  { id: 'pending', label: 'Received', description: 'Call received and queued' },
  { id: 'transcribing', label: 'Transcribing', description: 'Converting audio to text' },
  { id: 'scoring', label: 'Analysing', description: 'Scoring against CLOSER framework' },
  { id: 'complete', label: 'Complete', description: 'Results ready' },
] as const;

const SCORING_PHASES = [
  'Opening',
  'Clarify',
  'Label',
  'Overview',
  'Sell Vacation',
  'Pricing',
  'Objections',
  'Close',
];

function getStepIndex(status: string): number {
  const idx = STEPS.findIndex(s => s.id === status);
  return idx >= 0 ? idx : 0;
}

export function CallStatusPoller({ callId, status, durationSeconds }: CallStatusPollerProps) {
  const router = useRouter();
  const [elapsedMs, setElapsedMs] = useState(0);
  const [startTime] = useState(Date.now());

  const currentStepIndex = getStepIndex(status);

  // Poll for status updates
  useEffect(() => {
    if (!['pending', 'transcribing', 'scoring'].includes(status)) return;

    const pollInterval = setInterval(() => {
      router.refresh();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [status, callId, router]);

  // Track elapsed time for progress estimation
  useEffect(() => {
    if (!['pending', 'transcribing', 'scoring'].includes(status)) return;

    const timer = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 250);

    return () => clearInterval(timer);
  }, [status, startTime]);

  if (!['pending', 'transcribing', 'scoring'].includes(status)) {
    return null;
  }

  // Estimate progress within current step
  const estimateStepProgress = (): number => {
    const elapsed = elapsedMs / 1000; // seconds

    if (status === 'pending') {
      // Pending is usually very fast (< 5s)
      return Math.min(elapsed / 5 * 100, 95);
    }

    if (status === 'transcribing') {
      // Whisper typically takes ~3-6% of audio duration
      // e.g. 26 min call ≈ 60-90 seconds to transcribe
      const audioDuration = durationSeconds || 600; // default 10 min
      const expectedTranscribeTime = Math.max(audioDuration * 0.06, 30); // at least 30s
      return Math.min((elapsed / expectedTranscribeTime) * 100, 95);
    }

    if (status === 'scoring') {
      // Scoring takes ~30-50 seconds
      const expectedScoringTime = 45;
      return Math.min((elapsed / expectedScoringTime) * 100, 95);
    }

    return 0;
  };

  const stepProgress = estimateStepProgress();

  // Overall progress: each completed step = portion of total, plus current step progress
  const overallProgress = Math.min(
    ((currentStepIndex / (STEPS.length - 1)) + (stepProgress / 100) * (1 / (STEPS.length - 1))) * 100,
    95
  );

  // Current scoring phase (for detail display)
  const currentScoringPhaseIndex = status === 'scoring'
    ? Math.min(Math.floor((stepProgress / 100) * SCORING_PHASES.length), SCORING_PHASES.length - 1)
    : -1;

  const formatElapsed = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6">
      {/* Overall progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Processing call...
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(overallProgress)}%
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          Elapsed: {formatElapsed(elapsedMs)}
        </p>
      </div>

      {/* Step indicators */}
      <div className="relative">
        {STEPS.map((step, idx) => {
          const isComplete = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const isFuture = idx > currentStepIndex;

          return (
            <div key={step.id} className="flex items-start gap-4 relative">
              {/* Vertical connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`absolute left-[15px] top-[30px] w-0.5 h-[calc(100%-6px)] ${
                    isComplete ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}

              {/* Circle indicator */}
              <div className="flex-shrink-0 relative z-10">
                {isComplete ? (
                  <div className="w-[30px] h-[30px] rounded-full bg-blue-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : isCurrent ? (
                  <div className="w-[30px] h-[30px] rounded-full bg-blue-100 border-2 border-blue-600 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-[30px] h-[30px] rounded-full bg-gray-100 border-2 border-gray-200" />
                )}
              </div>

              {/* Step content */}
              <div className={`pb-6 ${idx === STEPS.length - 1 ? 'pb-0' : ''}`}>
                <p className={`text-sm font-medium ${
                  isComplete ? 'text-blue-600' : isCurrent ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {step.label}
                  {isCurrent && (
                    <span className="text-blue-600 ml-1">
                      — {Math.round(stepProgress)}%
                    </span>
                  )}
                </p>
                <p className={`text-xs mt-0.5 ${
                  isCurrent ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {step.description}
                </p>

                {/* Scoring phase detail */}
                {isCurrent && status === 'scoring' && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {SCORING_PHASES.map((phase, phaseIdx) => (
                      <span
                        key={phase}
                        className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                          phaseIdx < currentScoringPhaseIndex
                            ? 'bg-blue-600 text-white'
                            : phaseIdx === currentScoringPhaseIndex
                            ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-300'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {phase}
                      </span>
                    ))}
                  </div>
                )}

                {/* Transcription detail */}
                {isCurrent && status === 'transcribing' && durationSeconds && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    Audio length: {Math.round(durationSeconds / 60)} min — longer calls take a bit more time
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        This page updates automatically — no need to refresh.
      </p>
    </div>
  );
}
