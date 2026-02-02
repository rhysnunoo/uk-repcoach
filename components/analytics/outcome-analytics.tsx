'use client';

import { useEffect, useState, useMemo, memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface OutcomeAnalytics {
  summary: {
    totalCalls: number;
    closedCalls: number;
    overallConversionRate: number;
    avgScore: number;
  };
  outcomeBreakdown: Record<string, number>;
  conversionByScore: Array<{
    range: string;
    totalCalls: number;
    closedCalls: number;
    conversionRate: number;
  }>;
  phaseCorrelation: Array<{
    phase: string;
    avgScoreClosed: number;
    avgScoreNotClosed: number;
    scoreDifference: number;
    impactOnClose: string;
  }>;
  repPerformance: Array<{
    repId: string;
    repName: string;
    totalCalls: number;
    closedCalls: number;
    conversionRate: number;
    avgScore: number;
  }>;
  weeklyTrend: Array<{
    week: string;
    totalCalls: number;
    closedCalls: number;
    conversionRate: number;
  }>;
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

const OUTCOME_COLORS: Record<string, string> = {
  annual: '#22c55e',
  monthly: '#3b82f6',
  trial: '#8b5cf6',
  no_sale: '#ef4444',
  callback: '#f59e0b',
  voicemail: '#6b7280',
};

const PIE_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#6b7280'];

export function OutcomeAnalytics() {
  const [analytics, setAnalytics] = useState<OutcomeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/outcomes');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Must be before early returns to follow React hooks rules
  const outcomeData = useMemo(() => {
    if (!analytics) return [];
    return Object.entries(analytics.outcomeBreakdown).map(([name, value]) => ({
      name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
      color: OUTCOME_COLORS[name] || '#6b7280',
    }));
  }, [analytics]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-12 text-red-600">
        {error || 'Failed to load analytics'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card py-4 px-5">
          <p className="text-sm text-gray-500">Total Completed Calls</p>
          <p className="text-3xl font-bold text-gray-900">{analytics.summary.totalCalls}</p>
        </div>
        <div className="card py-4 px-5">
          <p className="text-sm text-gray-500">Closed Deals</p>
          <p className="text-3xl font-bold text-green-600">{analytics.summary.closedCalls}</p>
        </div>
        <div className="card py-4 px-5">
          <p className="text-sm text-gray-500">Conversion Rate</p>
          <p className="text-3xl font-bold text-blue-600">{analytics.summary.overallConversionRate}%</p>
        </div>
        <div className="card py-4 px-5">
          <p className="text-sm text-gray-500">Avg Call Score</p>
          <p className="text-3xl font-bold text-purple-600">{analytics.summary.avgScore}%</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Outcome Breakdown Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Outcome Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion by Score Range */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion by Score Range</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.conversionByScore}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Conversion Rate']} />
                <Bar dataKey="conversionRate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Higher scores correlate with better close rates
          </p>
        </div>
      </div>

      {/* Phase Impact on Closes */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phase Impact on Closing Deals</h3>
        <p className="text-sm text-gray-600 mb-4">
          Comparing average phase scores between closed and not-closed calls. Larger differences indicate phases with higher impact on outcomes.
        </p>
        <div className="space-y-3">
          {analytics.phaseCorrelation.map((phase) => (
            <div key={phase.phase} className="flex items-center gap-4">
              <div className="w-28 text-sm font-medium text-gray-700">
                {PHASE_LABELS[phase.phase] || phase.phase}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 bg-gray-100 h-6 rounded relative overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-green-500 opacity-70"
                    style={{ width: `${phase.avgScoreClosed}%` }}
                  />
                  <div
                    className="absolute left-0 top-0 h-full bg-red-400 opacity-50"
                    style={{ width: `${phase.avgScoreNotClosed}%` }}
                  />
                </div>
                <div className="w-20 text-right">
                  <span className={`text-sm font-bold ${
                    phase.scoreDifference > 5 ? 'text-green-600' :
                    phase.scoreDifference > 2 ? 'text-yellow-600' : 'text-gray-500'
                  }`}>
                    +{phase.scoreDifference}%
                  </span>
                </div>
              </div>
              <div className={`w-16 text-xs px-2 py-1 rounded text-center ${
                phase.impactOnClose === 'high' ? 'bg-green-100 text-green-700' :
                phase.impactOnClose === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {phase.impactOnClose}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-500 opacity-70 rounded"></span> Closed deals
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-400 opacity-50 rounded"></span> Not closed
          </span>
        </div>
      </div>

      {/* Weekly Trend */}
      {analytics.weeklyTrend.length > 1 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Trend (Last 12 Weeks)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="week"
                  tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  labelFormatter={(v) => `Week of ${new Date(v).toLocaleDateString()}`}
                  formatter={(value: number, name: string) => [
                    name === 'conversionRate' ? `${value.toFixed(1)}%` : value,
                    name === 'conversionRate' ? 'Conversion' : name === 'totalCalls' ? 'Calls' : 'Closed'
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="conversionRate"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Rep Performance (if available) */}
      {analytics.repPerformance.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rep Performance Comparison</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Rep</th>
                  <th className="text-right">Calls</th>
                  <th className="text-right">Closed</th>
                  <th className="text-right">Conv. Rate</th>
                  <th className="text-right">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {analytics.repPerformance.map((rep) => (
                  <tr key={rep.repId}>
                    <td className="font-medium">{rep.repName}</td>
                    <td className="text-right">{rep.totalCalls}</td>
                    <td className="text-right text-green-600">{rep.closedCalls}</td>
                    <td className="text-right">
                      <span className={`font-bold ${
                        rep.conversionRate >= 30 ? 'text-green-600' :
                        rep.conversionRate >= 15 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {rep.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={`${
                        rep.avgScore >= 80 ? 'text-green-600' :
                        rep.avgScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {rep.avgScore.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
