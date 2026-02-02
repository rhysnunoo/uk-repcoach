'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import type { Call } from '@/types/database';

interface TrendChartProps {
  calls: Call[];
}

export function TrendChart({ calls }: TrendChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    // Group calls by date
    const callsByDate: Record<string, { scores: number[]; date: Date }> = {};

    calls.forEach((call) => {
      const callDate = new Date(call.call_date);
      if (callDate >= thirtyDaysAgo && call.overall_score !== null) {
        const dateKey = format(callDate, 'yyyy-MM-dd');
        if (!callsByDate[dateKey]) {
          callsByDate[dateKey] = { scores: [], date: startOfDay(callDate) };
        }
        callsByDate[dateKey].scores.push(call.overall_score);
      }
    });

    // Convert to chart data
    const data = Object.entries(callsByDate)
      .map(([_, value]) => ({
        date: value.date,
        dateStr: format(value.date, 'MMM d'),
        score:
          value.scores.reduce((a, b) => a + b, 0) / value.scores.length,
        calls: value.scores.length,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return data;
  }, [calls]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No call data in the last 30 days
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="dateStr"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-200 p-2 text-sm">
                    <p className="font-medium text-gray-900">{data.dateStr}</p>
                    <p className="text-gray-600">
                      Avg Score: <span className="font-semibold">{data.score.toFixed(1)}%</span>
                    </p>
                    <p className="text-gray-500">
                      {data.calls} call{data.calls !== 1 ? 's' : ''}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine
            y={70}
            stroke="#EF4444"
            strokeDasharray="3 3"
            label={{
              value: '70% Target',
              position: 'right',
              fill: '#EF4444',
              fontSize: 10,
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#6366F1"
            strokeWidth={2}
            dot={{ fill: '#6366F1', strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: '#6366F1' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
