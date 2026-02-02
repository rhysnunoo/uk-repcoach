'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, subDays, startOfDay, parseISO } from 'date-fns';

interface Call {
  id: string;
  overall_score: number | null;
  call_date: string;
}

interface Score {
  call_id: string;
  phase: string;
  score: number;
}

interface ScoreTrendsProps {
  calls: Call[];
  scores: Score[];
  days?: number;
}

interface DataPoint {
  date: string;
  displayDate: string;
  overall: number;
  callCount: number;
  [phase: string]: string | number;
}

const PHASE_COLORS: Record<string, string> = {
  opening: '#3b82f6',     // blue
  clarify: '#8b5cf6',     // purple
  label: '#06b6d4',       // cyan
  overview: '#f59e0b',    // amber
  sell_vacation: '#10b981', // emerald
  explain: '#ec4899',     // pink
  reinforce: '#6366f1',   // indigo
};

const PHASE_LABELS: Record<string, string> = {
  opening: 'Opening',
  clarify: 'Clarify',
  label: 'Label',
  overview: 'Overview',
  sell_vacation: 'Sell Vacation',
  explain: 'Explain',
  reinforce: 'Reinforce',
};

export function ScoreTrends({ calls, scores, days = 30 }: ScoreTrendsProps) {
  const chartData = useMemo(() => {
    const cutoffDate = startOfDay(subDays(new Date(), days));

    // Filter calls within the date range
    const recentCalls = calls.filter(
      (call) => call.overall_score !== null && new Date(call.call_date) >= cutoffDate
    );

    if (recentCalls.length === 0) {
      return [];
    }

    // Group by date
    const dateGroups: Record<string, { calls: Call[]; scores: Score[] }> = {};

    for (const call of recentCalls) {
      const dateKey = format(new Date(call.call_date), 'yyyy-MM-dd');
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = { calls: [], scores: [] };
      }
      dateGroups[dateKey].calls.push(call);
    }

    // Add scores to date groups
    for (const score of scores) {
      const call = recentCalls.find((c) => c.id === score.call_id);
      if (call) {
        const dateKey = format(new Date(call.call_date), 'yyyy-MM-dd');
        if (dateGroups[dateKey]) {
          dateGroups[dateKey].scores.push(score);
        }
      }
    }

    // Calculate averages per date
    const dataPoints: DataPoint[] = Object.entries(dateGroups)
      .map(([date, data]): DataPoint => {
        const overall =
          data.calls.reduce((sum, c) => sum + (c.overall_score || 0), 0) / data.calls.length;

        const phaseAverages: Record<string, number> = {};
        const phaseCounts: Record<string, number> = {};

        for (const score of data.scores) {
          if (!phaseAverages[score.phase]) {
            phaseAverages[score.phase] = 0;
            phaseCounts[score.phase] = 0;
          }
          phaseAverages[score.phase] += score.score;
          phaseCounts[score.phase]++;
        }

        for (const phase of Object.keys(phaseAverages)) {
          phaseAverages[phase] = phaseAverages[phase] / phaseCounts[phase];
        }

        return {
          date,
          displayDate: format(parseISO(date), 'MMM d'),
          overall: Math.round(overall),
          callCount: data.calls.length,
          ...phaseAverages,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return dataPoints;
  }, [calls, scores, days]);

  // Calculate improvement metrics
  const improvement = useMemo(() => {
    if (chartData.length < 2) return null;

    const firstWeek = chartData.slice(0, Math.min(7, Math.ceil(chartData.length / 2)));
    const lastWeek = chartData.slice(-Math.min(7, Math.ceil(chartData.length / 2)));

    const firstAvg =
      firstWeek.reduce((sum, d) => sum + d.overall, 0) / firstWeek.length;
    const lastAvg =
      lastWeek.reduce((sum, d) => sum + d.overall, 0) / lastWeek.length;

    const diff = lastAvg - firstAvg;
    const percentChange = ((diff / firstAvg) * 100).toFixed(0);

    // Calculate phase improvements
    const phases = ['opening', 'clarify', 'label', 'overview', 'sell_vacation', 'explain', 'reinforce'];
    const phaseImprovements: { phase: string; diff: number; label: string }[] = [];

    for (const phase of phases) {
      const firstPhaseAvg =
        firstWeek.reduce((sum, d) => sum + (Number(d[phase]) || 0), 0) /
        firstWeek.filter((d) => d[phase] !== undefined).length;
      const lastPhaseAvg =
        lastWeek.reduce((sum, d) => sum + (Number(d[phase]) || 0), 0) /
        lastWeek.filter((d) => d[phase] !== undefined).length;

      if (!isNaN(firstPhaseAvg) && !isNaN(lastPhaseAvg)) {
        phaseImprovements.push({
          phase,
          diff: lastPhaseAvg - firstPhaseAvg,
          label: PHASE_LABELS[phase],
        });
      }
    }

    // Sort by improvement (most improved first)
    phaseImprovements.sort((a, b) => b.diff - a.diff);

    return {
      overall: diff,
      percentChange,
      isImproving: diff > 0,
      mostImproved: phaseImprovements[0],
      needsWork: phaseImprovements[phaseImprovements.length - 1],
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Not enough data to show trends.</p>
        <p className="text-sm mt-1">Complete more calls to see your progress over time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Improvement Summary */}
      {improvement && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 ${improvement.isImproving ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
            <p className="text-sm text-gray-600">Overall Trend</p>
            <p className={`text-2xl font-bold ${improvement.isImproving ? 'text-green-600' : 'text-red-600'}`}>
              {improvement.isImproving ? '↑' : '↓'} {Math.abs(improvement.overall).toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500">vs. first week</p>
          </div>

          {improvement.mostImproved && improvement.mostImproved.diff > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200">
              <p className="text-sm text-gray-600">Most Improved</p>
              <p className="text-lg font-bold text-blue-600">{improvement.mostImproved.label}</p>
              <p className="text-xs text-gray-500">+{improvement.mostImproved.diff.toFixed(0)}% improvement</p>
            </div>
          )}

          {improvement.needsWork && improvement.needsWork.diff < 0 && (
            <div className="p-4 bg-orange-50 border border-orange-200">
              <p className="text-sm text-gray-600">Focus Area</p>
              <p className="text-lg font-bold text-orange-600">{improvement.needsWork.label}</p>
              <p className="text-xs text-gray-500">{improvement.needsWork.diff.toFixed(0)}% decline</p>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0',
              }}
              formatter={(value: number, name: string) => [
                `${Math.round(value)}%`,
                name === 'overall' ? 'Overall' : PHASE_LABELS[name] || name,
              ]}
            />
            <Legend
              formatter={(value) =>
                value === 'overall' ? 'Overall' : PHASE_LABELS[value] || value
              }
            />
            <Line
              type="monotone"
              dataKey="overall"
              stroke="#111827"
              strokeWidth={3}
              dot={{ fill: '#111827', r: 4 }}
              activeDot={{ r: 6 }}
            />
            {Object.keys(PHASE_COLORS).map((phase) => (
              <Line
                key={phase}
                type="monotone"
                dataKey={phase}
                stroke={PHASE_COLORS[phase]}
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                hide
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-200">
        <span>{chartData.length} days with calls</span>
        <span>
          {chartData.reduce((sum, d) => sum + d.callCount, 0)} total calls
        </span>
      </div>
    </div>
  );
}
