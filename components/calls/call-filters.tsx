'use client';

import { useState } from 'react';

interface CallFiltersProps {
  onFilterChange: (filters: CallFilters) => void;
}

export interface CallFilters {
  status: string | null;
  source: string | null;
  scoreRange: [number, number] | null;
  dateRange: [Date, Date] | null;
}

export function CallFilters({ onFilterChange }: CallFiltersProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');

  const applyFilters = () => {
    onFilterChange({
      status,
      source,
      scoreRange: minScore || maxScore
        ? [parseInt(minScore) || 0, parseInt(maxScore) || 100]
        : null,
      dateRange: null,
    });
  };

  const clearFilters = () => {
    setStatus(null);
    setSource(null);
    setMinScore('');
    setMaxScore('');
    onFilterChange({
      status: null,
      source: null,
      scoreRange: null,
      dateRange: null,
    });
  };

  return (
    <div className="card">
      <div className="flex flex-wrap gap-4">
        {/* Status Filter */}
        <div className="flex-1 min-w-[150px]">
          <label className="label">Status</label>
          <select
            value={status || ''}
            onChange={(e) => setStatus(e.target.value || null)}
            className="input"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="transcribing">Transcribing</option>
            <option value="scoring">Scoring</option>
            <option value="complete">Complete</option>
            <option value="error">Error</option>
          </select>
        </div>

        {/* Source Filter */}
        <div className="flex-1 min-w-[150px]">
          <label className="label">Source</label>
          <select
            value={source || ''}
            onChange={(e) => setSource(e.target.value || null)}
            className="input"
          >
            <option value="">All Sources</option>
            <option value="hubspot">HubSpot</option>
            <option value="manual">Manual Upload</option>
          </select>
        </div>

        {/* Score Range */}
        <div className="flex-1 min-w-[200px]">
          <label className="label">Score Range</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Min"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="input w-20"
            />
            <span className="text-gray-500">to</span>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Max"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              className="input w-20"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-end gap-2">
          <button onClick={applyFilters} className="btn-primary">
            Apply
          </button>
          <button onClick={clearFilters} className="btn-secondary">
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
