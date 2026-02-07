'use client';

import { useState, useEffect } from 'react';

interface CategoryStats {
  category: string;
  count: number;
  avgScore: number;
  successRate: number;
  aaaRate: number;
}

interface TopObjection {
  objection: string;
  category: string;
  frequency: number;
  avgHandlingScore: number;
}

interface BestResponse {
  objection: string;
  category: string;
  response: string;
  score: number;
  rep_name: string;
}

interface ObjectionStats {
  totalObjections: number;
  avgHandlingScore: number;
  aaaUsageRate: number;
  byCategory: CategoryStats[];
  topObjections: TopObjection[];
  bestResponses: BestResponse[];
}

const CATEGORY_LABELS: Record<string, string> = {
  price: 'Price',
  timing: 'Timing',
  spouse: 'Spouse/Partner',
  skepticism: 'Skepticism',
  past_failures: 'Past Failures',
  competition: 'Competition',
  commitment: 'Commitment',
  other: 'Other',
};

export function ObjectionSummary() {
  const [stats, setStats] = useState<ObjectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/objections');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      setStats(result.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Objection Analysis</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-3 text-gray-600 text-sm">Analyzing objections...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Objection Analysis</h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!stats || stats.totalObjections === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Objection Analysis</h3>
        <p className="text-gray-500 text-sm">No objection data available yet. Objections are extracted from call transcripts.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-lg font-semibold text-gray-900">Objection Analysis</h3>
        <button className="text-gray-500 hover:text-gray-700">
          {expanded ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Summary Stats - Always Visible */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center p-3 bg-gray-50 rounded">
          <p className="text-2xl font-bold text-gray-900">{stats.totalObjections}</p>
          <p className="text-xs text-gray-500">Total Objections</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <p className={`text-2xl font-bold ${getScoreColor(stats.avgHandlingScore)}`}>
            {stats.avgHandlingScore}%
          </p>
          <p className="text-xs text-gray-500">Avg Handling Score</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <p className={`text-2xl font-bold ${stats.aaaUsageRate >= 50 ? 'text-green-600' : 'text-yellow-600'}`}>
            {stats.aaaUsageRate}%
          </p>
          <p className="text-xs text-gray-500">AAA Framework Usage</p>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-6 space-y-6">
          {/* By Category */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">By Category</h4>
            <div className="space-y-2">
              {stats.byCategory.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900 w-28">
                      {CATEGORY_LABELS[cat.category] || cat.category}
                    </span>
                    <span className="text-xs text-gray-500">{cat.count} objections</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={getScoreColor(cat.avgScore)}>
                      {cat.avgScore}% handled
                    </span>
                    <span className={cat.successRate >= 60 ? 'text-green-600' : 'text-red-600'}>
                      {cat.successRate}% success
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Objections */}
          {stats.topObjections.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Most Common Objections</h4>
              <div className="space-y-2">
                {stats.topObjections.slice(0, 5).map((obj, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 italic">&ldquo;{obj.objection}&rdquo;</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {CATEGORY_LABELS[obj.category] || obj.category} - {obj.frequency}x
                        </p>
                      </div>
                      <span className={`text-sm font-medium ${getScoreColor(obj.avgHandlingScore)}`}>
                        {obj.avgHandlingScore}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Responses */}
          {stats.bestResponses.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Best Responses to Learn From</h4>
              <div className="space-y-3">
                {stats.bestResponses.slice(0, 3).map((resp, idx) => (
                  <div key={idx} className="p-3 border border-green-200 bg-green-50 rounded">
                    <p className="text-xs text-gray-500 mb-1">
                      Objection: <span className="italic">&ldquo;{resp.objection}&rdquo;</span>
                    </p>
                    <p className="text-sm text-gray-900">{resp.response}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">- {resp.rep_name}</span>
                      <span className="text-xs font-medium text-green-700">{resp.score}% score</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!expanded && (
        <p className="text-xs text-gray-500 mt-3 text-center">
          Click to expand for detailed breakdown
        </p>
      )}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 70) return 'text-yellow-600';
  return 'text-red-600';
}
