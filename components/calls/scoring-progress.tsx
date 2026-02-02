'use client';

import { useState, useEffect } from 'react';

interface ScoringProgressProps {
  callId: string;
  initialStatus: string;
  onComplete?: () => void;
}

const SCORING_PHASES = [
  { id: 'opening', label: 'Opening', duration: 4000 },
  { id: 'clarify', label: 'Clarify', duration: 4000 },
  { id: 'label', label: 'Label', duration: 3000 },
  { id: 'overview', label: 'Overview/Pain', duration: 6000 },
  { id: 'sell_vacation', label: 'Sell Vacation', duration: 4000 },
  { id: 'price_presentation', label: 'Price Presentation', duration: 4000 },
  { id: 'explain', label: 'Objection Handling', duration: 4000 },
  { id: 'reinforce', label: 'Close', duration: 4000 },
  { id: 'summary', label: 'Generating Summary', duration: 5000 },
];

export function ScoringProgress({ callId, initialStatus, onComplete }: ScoringProgressProps) {
  const [status, setStatus] = useState(initialStatus);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Simulate progress through phases
  useEffect(() => {
    if (status !== 'scoring') return;

    let totalElapsed = 0;
    const totalDuration = SCORING_PHASES.reduce((sum, p) => sum + p.duration, 0);

    const interval = setInterval(() => {
      totalElapsed += 100;

      // Calculate which phase we're in
      let accumulated = 0;
      for (let i = 0; i < SCORING_PHASES.length; i++) {
        accumulated += SCORING_PHASES[i].duration;
        if (totalElapsed < accumulated) {
          setCurrentPhaseIndex(i);
          break;
        }
      }

      // Calculate overall progress
      const pct = Math.min((totalElapsed / totalDuration) * 100, 95);
      setProgress(pct);

      // Cap at 95% - actual completion comes from polling
      if (totalElapsed >= totalDuration) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [status]);

  // Poll for actual status
  useEffect(() => {
    if (status !== 'scoring') return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/calls/${callId}/status`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'complete') {
            setStatus('complete');
            setProgress(100);
            onComplete?.();
            clearInterval(pollInterval);
          } else if (data.status === 'error') {
            setStatus('error');
            clearInterval(pollInterval);
          }
        }
      } catch {
        // Ignore polling errors
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [callId, status, onComplete]);

  if (status === 'complete') {
    return (
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-green-900">Scoring Complete</p>
            <p className="text-sm text-green-700">Refresh to see results</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-red-900">Scoring Failed</p>
            <p className="text-sm text-red-700">Please try re-scoring this call</p>
          </div>
        </div>
      </div>
    );
  }

  if (status !== 'scoring') {
    return null;
  }

  const currentPhase = SCORING_PHASES[currentPhaseIndex];

  return (
    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-medium text-blue-900">Analyzing Call</p>
          <p className="text-sm text-blue-700">
            {currentPhase ? `Scoring ${currentPhase.label}...` : 'Starting analysis...'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-blue-600 mt-1 text-right">{Math.round(progress)}%</p>
      </div>

      {/* Phase indicators */}
      <div className="mt-3 flex flex-wrap gap-1">
        {SCORING_PHASES.slice(0, -1).map((phase, idx) => (
          <span
            key={phase.id}
            className={`text-xs px-2 py-0.5 rounded ${
              idx < currentPhaseIndex
                ? 'bg-blue-600 text-white'
                : idx === currentPhaseIndex
                ? 'bg-blue-300 text-blue-900 animate-pulse'
                : 'bg-blue-100 text-blue-400'
            }`}
          >
            {phase.label}
          </span>
        ))}
      </div>
    </div>
  );
}
