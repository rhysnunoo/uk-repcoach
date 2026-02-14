'use client';

import { useState, useEffect } from 'react';
import { getScoreColor } from '@/lib/utils/format';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';

interface RepStats {
  rep_id: string;
  rep_name: string;
  total_calls: number;
  scored_calls: number;
  avg_score: number;
  conversion_rate: number;
  phase_scores: Record<string, number>;
  trend: number;
  practice_sessions: number;
  last_call_date: string | null;
}

interface TeamStats {
  avg_score: number;
  avg_conversion: number;
  total_calls: number;
  avg_practice: number;
}

const PHASE_LABELS: Record<string, string> = {
  opening: 'Opening',
  clarify: 'Clarify',
  label: 'Label',
  overview: 'Overview',
  sell_vacation: 'Sell Vacation',
  explain: 'Explain',
  reinforce: 'Reinforce',
};

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

export function RepComparison() {
  const [data, setData] = useState<{ reps: RepStats[]; teamStats: TeamStats } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReps, setSelectedReps] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'score' | 'calls' | 'conversion' | 'trend'>('score');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/rep-comparison');
      const result = await response.json();

      if (response.status === 403) {
        setError(result.error || 'This feature is available for managers only');
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      setData(result);

      // Select top 3 reps by default
      if (result.reps && result.reps.length > 0) {
        setSelectedReps(result.reps.slice(0, Math.min(3, result.reps.length)).map((r: RepStats) => r.rep_id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleRep = (repId: string) => {
    setSelectedReps(prev =>
      prev.includes(repId)
        ? prev.filter(id => id !== repId)
        : [...prev, repId]
    );
  };

  const selectAllReps = () => {
    setSelectedReps(data?.reps.map(r => r.rep_id) || []);
  };

  const clearSelection = () => {
    setSelectedReps([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600">Loading rep comparison...</span>
      </div>
    );
  }

  if (error) {
    const isPermissionError = error.includes('manager');
    return (
      <div className={`${isPermissionError ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'} border p-6 text-center`}>
        <svg
          className={`mx-auto h-12 w-12 ${isPermissionError ? 'text-yellow-400' : 'text-red-400'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isPermissionError ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          )}
        </svg>
        <p className={`mt-4 text-lg font-medium ${isPermissionError ? 'text-yellow-800' : 'text-red-700'}`}>
          {error}
        </p>
        {isPermissionError && (
          <p className="mt-2 text-sm text-yellow-600">
            Contact your admin to request manager access.
          </p>
        )}
        {!isPermissionError && (
          <button onClick={fetchData} className="mt-4 btn-secondary btn-sm">
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (!data || data.reps.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No rep data available yet.</p>
      </div>
    );
  }

  // Sort reps
  const sortedReps = [...data.reps].sort((a, b) => {
    switch (sortBy) {
      case 'calls': return b.total_calls - a.total_calls;
      case 'conversion': return b.conversion_rate - a.conversion_rate;
      case 'trend': return b.trend - a.trend;
      default: return b.avg_score - a.avg_score;
    }
  });

  // Get selected reps for charts
  const selectedRepData = data.reps.filter(r => selectedReps.includes(r.rep_id));

  // Prepare radar chart data
  const radarData = Object.keys(PHASE_LABELS).map(phase => {
    const point: Record<string, unknown> = { phase: PHASE_LABELS[phase] };
    selectedRepData.forEach((rep, idx) => {
      point[rep.rep_name] = rep.phase_scores[phase] || 0;
    });
    return point;
  });

  // Prepare bar chart data for overall comparison
  const barData = selectedRepData.map((rep, idx) => ({
    name: rep.rep_name.split(' ')[0], // First name only for brevity
    score: rep.avg_score,
    conversion: rep.conversion_rate,
    color: COLORS[idx % COLORS.length],
  }));

  return (
    <div className="space-y-8">
      {/* Team Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Team Avg Score</p>
          <p className="text-2xl font-bold text-gray-900">{data.teamStats.avg_score}%</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Team Avg Conversion</p>
          <p className="text-2xl font-bold text-green-600">{data.teamStats.avg_conversion}%</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Calls (30d)</p>
          <p className="text-2xl font-bold text-gray-900">{data.teamStats.total_calls}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Avg Practice Sessions</p>
          <p className="text-2xl font-bold text-blue-600">{data.teamStats.avg_practice}</p>
        </div>
      </div>

      {/* Rep Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Select Reps to Compare</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAllReps}
              className="text-sm text-primary hover:text-primary-600"
            >
              Select All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={clearSelection}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="input w-auto ml-4"
            >
              <option value="score">Sort by Score</option>
              <option value="calls">Sort by Calls</option>
              <option value="conversion">Sort by Conversion</option>
              <option value="trend">Sort by Trend</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {sortedReps.map((rep, idx) => (
            <button
              key={rep.rep_id}
              onClick={() => toggleRep(rep.rep_id)}
              className={`px-3 py-2 text-sm font-medium border transition-colors ${
                selectedReps.includes(rep.rep_id)
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2">
                {selectedReps.includes(rep.rep_id) && (
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[selectedReps.indexOf(rep.rep_id) % COLORS.length] }}
                  />
                )}
                {rep.rep_name}
                <span className={`text-xs ${selectedReps.includes(rep.rep_id) ? 'text-white/80' : 'text-gray-400'}`}>
                  {rep.avg_score}%
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Charts Row - only show when reps are selected */}
      {selectedRepData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overall Comparison Bar Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Score & Conversion</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value}%`,
                      name === 'score' ? 'Avg Score' : 'Conversion Rate',
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="score" name="Avg Score" fill="#3b82f6" />
                  <Bar dataKey="conversion" name="Conversion" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Chart - Phase Comparison */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">CLOSER Phase Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="phase" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  {selectedRepData.map((rep, idx) => (
                    <Radar
                      key={rep.rep_id}
                      name={rep.rep_name}
                      dataKey={rep.rep_name}
                      stroke={COLORS[idx % COLORS.length]}
                      fill={COLORS[idx % COLORS.length]}
                      fillOpacity={0.2}
                    />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Rep Leaderboard */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rep Leaderboard</h3>
        <p className="text-sm text-gray-500 mb-4">Click a row to select/deselect for chart comparison</p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rep</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Calls</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Conversion</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trend</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weakest Phase</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedReps.map((rep, idx) => {
                const isSelected = selectedReps.includes(rep.rep_id);
                const selectedIndex = selectedReps.indexOf(rep.rep_id);

                // Find weakest phase
                const weakestPhase = Object.entries(rep.phase_scores)
                  .filter(([, score]) => score > 0)
                  .sort((a, b) => a[1] - b[1])[0];

                return (
                  <tr
                    key={rep.rep_id}
                    className={`${isSelected ? 'bg-blue-50' : ''} hover:bg-gray-50 cursor-pointer`}
                    onClick={() => toggleRep(rep.rep_id)}
                  >
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {idx === 0 ? '1st' :
                       idx === 1 ? '2nd' :
                       idx === 2 ? '3rd' :
                       `#${idx + 1}`}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[selectedIndex % COLORS.length] }}
                          />
                        )}
                        <span className="font-medium text-gray-900">{rep.rep_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${getScoreColor(rep.avg_score)}`}>
                        {rep.avg_score}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{rep.total_calls}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={getScoreColor(rep.conversion_rate)}>
                        {rep.conversion_rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`${rep.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {rep.trend >= 0 ? '+' : ''}{rep.trend}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {weakestPhase ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">
                            {PHASE_LABELS[weakestPhase[0]] || weakestPhase[0]}
                          </span>
                          <span className="text-xs text-red-600 font-medium">
                            ({weakestPhase[1]}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}