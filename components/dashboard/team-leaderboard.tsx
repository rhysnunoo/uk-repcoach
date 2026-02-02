// Server component - no interactivity needed

import type { LeaderboardEntry } from '@/types/database';

interface TeamLeaderboardProps {
  entries: LeaderboardEntry[];
}

export function TeamLeaderboard({ entries }: TeamLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No team data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th className="w-16">Rank</th>
            <th>Rep</th>
            <th className="text-center">Calls</th>
            <th className="text-center">Avg Score</th>
            <th className="text-center">Trend</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={entry.rep_id}>
              <td>
                <RankBadge rank={index + 1} />
              </td>
              <td className="font-medium">{entry.rep_name}</td>
              <td className="text-center">{entry.calls_count}</td>
              <td className="text-center">
                <span className={`font-semibold ${getScoreColor(entry.average_score)}`}>
                  {entry.average_score.toFixed(0)}%
                </span>
              </td>
              <td className="text-center">
                <TrendIndicator trend={entry.trend} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-800 font-bold">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-700 font-bold">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-800 font-bold">
        3
      </span>
    );
  }
  return (
    <span className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 font-medium">
      {rank}
    </span>
  );
}

function TrendIndicator({ trend }: { trend: number }) {
  if (trend > 0) {
    return (
      <span className="inline-flex items-center text-green-600 text-sm">
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        +{trend.toFixed(1)}%
      </span>
    );
  }
  if (trend < 0) {
    return (
      <span className="inline-flex items-center text-red-600 text-sm">
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        {trend.toFixed(1)}%
      </span>
    );
  }
  return <span className="text-gray-500 text-sm">—</span>;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 70) return 'text-yellow-600';
  return 'text-red-600';
}
