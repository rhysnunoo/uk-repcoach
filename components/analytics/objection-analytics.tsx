'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface CategoryStats {
  category: string;
  count: number;
  avgScore: number;
  successRate: number;
  aaaRate: number;
}

interface RepObjectionStats {
  rep_id: string;
  rep_name: string;
  totalObjections: number;
  avgHandlingScore: number;
  successRate: number;
  aaaRate: number;
  strongestCategory: string;
  weakestCategory: string;
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
  byRep: RepObjectionStats[];
  topObjections: TopObjection[];
  bestResponses: BestResponse[];
}

const CATEGORY_COLORS: Record<string, string> = {
  price: '#ef4444',
  timing: '#f59e0b',
  spouse: '#8b5cf6',
  skepticism: '#3b82f6',
  past_failures: '#6366f1',
  competition: '#ec4899',
  commitment: '#14b8a6',
  other: '#6b7280',
};

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

export function ObjectionAnalytics() {
  const [data, setData] = useState<ObjectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRep, setSelectedRep] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/objections');
      if (!response.ok) throw new Error('Failed to fetch objection data');
      const result = await response.json();
      setData(result.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600">Analyzing objection patterns...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button onClick={fetchData} className="mt-2 btn-secondary btn-sm">
          Try Again
        </button>
      </div>
    );
  }

  if (!data || data.totalObjections === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No objection data available yet.</p>
        <p className="text-sm text-gray-500 mt-2">
          Objections will be analyzed from call transcripts as calls are scored.
        </p>
      </div>
    );
  }

  const pieData = data.byCategory.map(cat => ({
    name: CATEGORY_LABELS[cat.category] || cat.category,
    value: cat.count,
    color: CATEGORY_COLORS[cat.category] || '#6b7280',
  }));

  const radarData = data.byCategory.map(cat => ({
    category: CATEGORY_LABELS[cat.category] || cat.category,
    avgScore: cat.avgScore,
    successRate: cat.successRate,
    aaaRate: cat.aaaRate,
  }));

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Objections</p>
          <p className="text-2xl font-bold text-gray-900">{data.totalObjections}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Avg Handling Score</p>
          <p className={`text-2xl font-bold ${getScoreColor(data.avgHandlingScore)}`}>
            {data.avgHandlingScore}%
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">AAA Framework Usage</p>
          <p className={`text-2xl font-bold ${data.aaaUsageRate >= 70 ? 'text-green-600' : data.aaaUsageRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
            {data.aaaUsageRate}%
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Categories Tracked</p>
          <p className="text-2xl font-bold text-gray-900">{data.byCategory.length}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Objection Distribution Pie Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Objection Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Handling Performance by Category */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Handling Score by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis
                  dataKey="category"
                  type="category"
                  width={80}
                  tickFormatter={(val) => CATEGORY_LABELS[val] || val}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Avg Score']}
                  labelFormatter={(label) => CATEGORY_LABELS[label] || label}
                />
                <Bar dataKey="avgScore" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Radar Chart - Category Performance */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance Overview</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="Avg Score"
                dataKey="avgScore"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
              <Radar
                name="Success Rate"
                dataKey="successRate"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
              />
              <Radar
                name="AAA Usage"
                dataKey="aaaRate"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
              />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Objections Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Objections</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Objection</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Frequency</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Score</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.topObjections.map((obj, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-md truncate">
                    &quot;{obj.objection}&quot;
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[obj.category]}20`,
                        color: CATEGORY_COLORS[obj.category],
                      }}
                    >
                      {CATEGORY_LABELS[obj.category] || obj.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{obj.frequency}x</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-medium ${getScoreColor(obj.avgHandlingScore)}`}>
                      {obj.avgHandlingScore}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rep Performance Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rep Objection Handling</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rep</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Objections</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Success Rate</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">AAA Usage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Strongest</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Needs Work</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.byRep.map((rep) => (
                <tr
                  key={rep.rep_id}
                  className={`hover:bg-gray-50 cursor-pointer ${selectedRep === rep.rep_id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedRep(selectedRep === rep.rep_id ? null : rep.rep_id)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{rep.rep_name}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{rep.totalObjections}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-medium ${getScoreColor(rep.avgHandlingScore)}`}>
                      {rep.avgHandlingScore}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-medium ${getScoreColor(rep.successRate)}`}>
                      {rep.successRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm ${rep.aaaRate >= 70 ? 'text-green-600' : rep.aaaRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {rep.aaaRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {rep.strongestCategory && (
                      <span
                        className="px-2 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[rep.strongestCategory]}20`,
                          color: CATEGORY_COLORS[rep.strongestCategory],
                        }}
                      >
                        {CATEGORY_LABELS[rep.strongestCategory] || rep.strongestCategory}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {rep.weakestCategory && (
                      <span
                        className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700"
                      >
                        {CATEGORY_LABELS[rep.weakestCategory] || rep.weakestCategory}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Best Responses */}
      {data.bestResponses.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top-Rated Responses</h3>
          <p className="text-sm text-gray-500 mb-4">
            Learn from these highly-scored objection handling examples
          </p>
          <div className="space-y-4">
            {data.bestResponses.map((resp, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[resp.category]}20`,
                        color: CATEGORY_COLORS[resp.category],
                      }}
                    >
                      {CATEGORY_LABELS[resp.category] || resp.category}
                    </span>
                    <span className="text-sm text-gray-500">by {resp.rep_name}</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">{resp.score}%</span>
                </div>
                <div className="mb-2">
                  <p className="text-sm text-gray-600 italic">&quot;{resp.objection}&quot;</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm text-green-800">{resp.response}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 70) return 'text-yellow-600';
  return 'text-red-600';
}
