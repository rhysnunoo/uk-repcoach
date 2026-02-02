'use client';

import { useState, useEffect, useCallback } from 'react';

interface QueueItem {
  callId: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  addedAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  score?: number;
}

interface QueueStatus {
  total: number;
  pending: number;
  processing: number;
  complete: number;
  error: number;
  items: QueueItem[];
}

export function BatchScorePanel() {
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/calls/batch-score');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch queue status:', error);
    }
  }, []);

  // Poll for status when queue is active
  useEffect(() => {
    fetchStatus();

    const hasActive = status && (status.pending > 0 || status.processing > 0);
    if (hasActive) {
      const interval = setInterval(fetchStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [fetchStatus, status?.pending, status?.processing]);

  const scoreAll = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/calls/batch-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'score_all' }),
      });
      const data = await response.json();
      setMessage(data.message);
      setIsExpanded(true);
      fetchStatus();
    } catch (error) {
      setMessage('Failed to start batch scoring');
    } finally {
      setLoading(false);
    }
  };

  const clearCompleted = async () => {
    try {
      await fetch('/api/calls/batch-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_completed' }),
      });
      fetchStatus();
    } catch (error) {
      console.error('Failed to clear completed:', error);
    }
  };

  const hasActiveQueue = status && (status.pending > 0 || status.processing > 0);
  const hasCompletedItems = status && (status.complete > 0 || status.error > 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="card-header mb-0">Batch Scoring</h3>
        {hasActiveQueue && (
          <span className="flex items-center gap-2 text-sm text-blue-600">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            Processing
          </span>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={scoreAll}
          disabled={loading}
          className="btn-primary btn-sm"
        >
          {loading ? 'Starting...' : 'Score All Pending Calls'}
        </button>
        {hasCompletedItems && (
          <button
            onClick={clearCompleted}
            className="btn-secondary btn-sm"
          >
            Clear Completed
          </button>
        )}
      </div>

      {/* Status Message */}
      {message && (
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 text-sm text-blue-700 rounded">
          {message}
        </div>
      )}

      {/* Queue Status Summary */}
      {status && status.total > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-lg font-bold text-gray-600">{status.pending}</div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
            <div className="p-2 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-600">{status.processing}</div>
              <div className="text-xs text-blue-500">Processing</div>
            </div>
            <div className="p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-600">{status.complete}</div>
              <div className="text-xs text-green-500">Complete</div>
            </div>
            <div className="p-2 bg-red-50 rounded">
              <div className="text-lg font-bold text-red-600">{status.error}</div>
              <div className="text-xs text-red-500">Failed</div>
            </div>
          </div>

          {/* Progress Bar */}
          {status.total > 0 && (
            <div className="mt-3">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${(status.complete / status.total) * 100}%` }}
                />
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${(status.processing / status.total) * 100}%` }}
                />
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${(status.error / status.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {status.complete + status.error} of {status.total} processed
              </p>
            </div>
          )}

          {/* Expandable Items List */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>

          {isExpanded && (
            <div className="mt-3 max-h-60 overflow-y-auto space-y-1">
              {status.items.map((item) => (
                <div
                  key={item.callId}
                  className={`flex items-center justify-between p-2 rounded text-sm ${
                    item.status === 'processing'
                      ? 'bg-blue-50'
                      : item.status === 'complete'
                      ? 'bg-green-50'
                      : item.status === 'error'
                      ? 'bg-red-50'
                      : 'bg-gray-50'
                  }`}
                >
                  <span className="font-mono text-xs truncate max-w-[200px]">
                    {item.callId.slice(0, 8)}...
                  </span>
                  <span className="flex items-center gap-2">
                    {item.status === 'processing' && (
                      <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    )}
                    {item.status === 'complete' && item.score !== undefined && (
                      <span className={`font-medium ${
                        item.score >= 80 ? 'text-green-600' :
                        item.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {item.score}%
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-red-600 text-xs" title={item.error}>
                        Failed
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      item.status === 'processing'
                        ? 'bg-blue-100 text-blue-700'
                        : item.status === 'complete'
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'error'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.status}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {(!status || status.total === 0) && (
        <p className="text-sm text-gray-500">
          No calls in the scoring queue. Click &quot;Score All Pending Calls&quot; to queue all unscored calls.
        </p>
      )}
    </div>
  );
}
