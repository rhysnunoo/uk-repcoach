'use client';

import { useState, useEffect } from 'react';

interface PhaseData {
  phase: string;
  label: string;
  average: number;
  count: number;
  variance: number;
}

interface WeakSpotsData {
  phaseAverages: PhaseData[];
  weakestPhases: PhaseData[];
  strongestPhases: PhaseData[];
  recentTrend: Array<{ date: string; score: number }>;
  callCount: number;
  overallAverage: number;
  suggestions: string[];
}

interface WeakSpotsCardProps {
  repId?: string;
}

export function WeakSpotsCard({ repId }: WeakSpotsCardProps) {
  const [data, setData] = useState<WeakSpotsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const url = repId
          ? `/api/analytics/weak-spots?repId=${repId}`
          : '/api/analytics/weak-spots';
        const response = await fetch(url);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          setError('Failed to load data');
        }
      } catch {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [repId]);

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card">
        <p className="text-gray-500 text-sm">Unable to load performance data</p>
      </div>
    );
  }

  if (data.callCount === 0) {
    return (
      <div className="card">
        <h3 className="card-header">Your Performance</h3>
        <p className="text-gray-500 text-sm">
          Complete some calls to see your performance breakdown by CLOSER phase.
        </p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="card-header mb-0">Your Weak Spots</h3>
        <span className="text-sm text-gray-500">
          Based on {data.callCount} calls (30 days)
        </span>
      </div>

      {/* Overall Average */}
      <div className="flex items-center gap-4 mb-6 p-3 bg-gray-50 rounded-lg">
        <div className={`text-3xl font-bold ${data.overallAverage >= 70 ? 'text-green-600' : data.overallAverage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
          {data.overallAverage}%
        </div>
        <div>
          <p className="font-medium text-gray-900">Overall Average</p>
          <p className="text-sm text-gray-500">Across all CLOSER phases</p>
        </div>
      </div>

      {/* Phase Breakdown */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-gray-700">Score by Phase</h4>
        {data.phaseAverages.map((phase) => (
          <div key={phase.phase} className="flex items-center gap-3">
            <div className="w-28 text-sm text-gray-700 truncate" title={phase.label}>
              {phase.label}
            </div>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${getBarColor(phase.average)} transition-all duration-500`}
                style={{ width: `${phase.average}%` }}
              />
            </div>
            <div className={`w-12 text-sm font-medium ${phase.average < 60 ? 'text-red-600' : 'text-gray-700'}`}>
              {phase.average}%
            </div>
          </div>
        ))}
      </div>

      {/* Areas to Improve */}
      {data.weakestPhases.length > 0 && data.weakestPhases[0].average < 70 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Focus Areas</h4>
          <div className="space-y-2">
            {data.weakestPhases.filter(p => p.average < 70).slice(0, 2).map((phase) => (
              <div
                key={phase.phase}
                className="flex items-center justify-between p-2 bg-red-50 border border-red-100 rounded"
              >
                <span className="text-sm font-medium text-red-800">{phase.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${getScoreColor(phase.average)}`}>
                  {phase.average}% avg
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {data.suggestions && data.suggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Improvement Tips</h4>
          <ul className="space-y-2">
            {data.suggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-primary mt-0.5">→</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strengths */}
      {data.strongestPhases.length > 0 && data.strongestPhases[0].average >= 80 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Your Strengths</h4>
          <div className="flex flex-wrap gap-2">
            {data.strongestPhases.filter(p => p.average >= 80).map((phase) => (
              <span
                key={phase.phase}
                className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded"
              >
                {phase.label}: {phase.average}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
