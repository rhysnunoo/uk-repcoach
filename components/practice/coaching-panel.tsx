'use client';

import { useState } from 'react';
import type { CoachingHint, PhaseProgress } from '@/lib/practice/coaching';

interface CoachingPanelProps {
  hints: CoachingHint[];
  phaseProgress: PhaseProgress[];
  isEnabled: boolean;
  onToggle: () => void;
}

export function CoachingPanel({ hints, phaseProgress, isEnabled, onToggle }: CoachingPanelProps) {
  const [expandedHint, setExpandedHint] = useState<number | null>(null);

  if (!isEnabled) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-24 right-4 bg-amber-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-amber-600 transition-colors z-10"
      >
        Enable Coach Mode
      </button>
    );
  }

  return (
    <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-amber-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <h3 className="font-semibold text-amber-900">Coach Mode</h3>
        </div>
        <button
          onClick={onToggle}
          className="text-amber-600 hover:text-amber-800 text-sm"
        >
          Hide
        </button>
      </div>

      {/* Phase Progress */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">CLOSER Progress</h4>
        <div className="space-y-1">
          {phaseProgress.map((phase) => (
            <div
              key={phase.phase}
              className={`flex items-center gap-2 text-sm ${
                phase.current
                  ? 'text-amber-700 font-medium'
                  : phase.completed
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                phase.current
                  ? 'bg-amber-500 text-white'
                  : phase.completed
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200'
              }`}>
                {phase.completed ? '✓' : phase.current ? '→' : ''}
              </span>
              <span>{phase.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hints */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase">Suggestions</h4>

        {hints.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Start the conversation to see coaching hints.</p>
        ) : (
          hints.map((hint, index) => (
            <div
              key={index}
              className={`rounded-lg border ${
                hint.priority === 'high'
                  ? 'border-amber-300 bg-amber-50'
                  : hint.priority === 'medium'
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <button
                onClick={() => setExpandedHint(expandedHint === index ? null : index)}
                className="w-full text-left px-3 py-2"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5">
                    {hint.type === 'objection_tip' && '⚠️'}
                    {hint.type === 'phase_reminder' && '📍'}
                    {hint.type === 'technique' && '💡'}
                    {hint.type === 'warning' && '🚨'}
                    {hint.type === 'encouragement' && '✨'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      hint.priority === 'high' ? 'text-amber-900' : 'text-gray-900'
                    }`}>
                      {hint.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                      {hint.message}
                    </p>
                  </div>
                  <span className="text-gray-400 text-xs">
                    {expandedHint === index ? '▼' : '▶'}
                  </span>
                </div>
              </button>

              {expandedHint === index && hint.scriptExample && (
                <div className="px-3 pb-3 pt-1 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Try saying:</p>
                  <p className="text-sm text-gray-700 italic bg-white p-2 rounded border border-gray-200">
                    {hint.scriptExample}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quick Tips */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-500">
          💡 <strong>Tip:</strong> Listen more than you talk. The prospect should be doing 60-70% of the talking.
        </p>
      </div>
    </div>
  );
}
