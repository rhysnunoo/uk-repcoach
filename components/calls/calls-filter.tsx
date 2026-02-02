'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback } from 'react';

interface CallsFilterProps {
  showRepFilter?: boolean;
}

export function CallsFilter({ showRepFilter = false }: CallsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [scoreMin, setScoreMin] = useState(searchParams.get('scoreMin') || '');
  const [scoreMax, setScoreMax] = useState(searchParams.get('scoreMax') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [outcome, setOutcome] = useState(searchParams.get('outcome') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();

    if (search) params.set('search', search);
    if (scoreMin) params.set('scoreMin', scoreMin);
    if (scoreMax) params.set('scoreMax', scoreMax);
    if (status) params.set('status', status);
    if (outcome) params.set('outcome', outcome);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);

    router.push(`/calls?${params.toString()}`);
  }, [router, search, scoreMin, scoreMax, status, outcome, dateFrom, dateTo]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setScoreMin('');
    setScoreMax('');
    setStatus('');
    setOutcome('');
    setDateFrom('');
    setDateTo('');
    router.push('/calls');
  }, [router]);

  const hasFilters = search || scoreMin || scoreMax || status || outcome || dateFrom || dateTo;

  return (
    <div className="card mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="label">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder="Contact name..."
            className="input"
          />
        </div>

        {/* Score Range */}
        <div>
          <label className="label">Score Range</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={scoreMin}
              onChange={(e) => setScoreMin(e.target.value)}
              placeholder="Min"
              min="0"
              max="100"
              className="input"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              value={scoreMax}
              onChange={(e) => setScoreMax(e.target.value)}
              placeholder="Max"
              min="0"
              max="100"
              className="input"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="label">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input"
          >
            <option value="">All statuses</option>
            <option value="complete">Complete</option>
            <option value="scoring">Scoring</option>
            <option value="transcribing">Transcribing</option>
            <option value="pending">Pending</option>
            <option value="error">Error</option>
          </select>
        </div>

        {/* Outcome */}
        <div>
          <label className="label">Outcome</label>
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className="input"
          >
            <option value="">All outcomes</option>
            <option value="annual">Closed - Annual</option>
            <option value="monthly">Closed - Monthly</option>
            <option value="trial">Closed - Trial</option>
            <option value="callback">Callback</option>
            <option value="not_interested">Not Interested</option>
            <option value="no_show">No Show</option>
            <option value="none">No outcome set</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="label">From Date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="label">To Date</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input"
          />
        </div>

        {/* Actions */}
        <div className="flex items-end gap-2 lg:col-span-2">
          <button onClick={applyFilters} className="btn-primary">
            Apply Filters
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
        <span className="text-sm text-gray-500 mr-2">Quick filters:</span>
        <button
          onClick={() => {
            setScoreMax('60');
            setScoreMin('');
            setStatus('complete');
            setTimeout(applyFilters, 0);
          }}
          className="text-sm text-primary hover:text-primary-dark"
        >
          Low scores (&lt;60%)
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={() => {
            setScoreMin('80');
            setScoreMax('');
            setStatus('complete');
            setTimeout(applyFilters, 0);
          }}
          className="text-sm text-primary hover:text-primary-dark"
        >
          High scores (&gt;80%)
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={() => {
            setOutcome('annual');
            setTimeout(applyFilters, 0);
          }}
          className="text-sm text-primary hover:text-primary-dark"
        >
          Closed deals
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={() => {
            setStatus('error');
            setTimeout(applyFilters, 0);
          }}
          className="text-sm text-primary hover:text-primary-dark"
        >
          Errors
        </button>
      </div>
    </div>
  );
}
