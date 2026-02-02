'use client';

import { useMemo, memo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Profile, Call } from '@/types/database';
import { StatCard, StatusBadge, StatusIndicator, AlertItem } from '@/components/ui/shared';
import { getScoreColor } from '@/lib/utils/format';

interface ManagerDashboardProps {
  profile: Profile;
  recentCalls: Call[];
  scores: Record<string, unknown[]>;
}

export const ManagerDashboard = memo(function ManagerDashboard({
  recentCalls,
  scores,
}: ManagerDashboardProps) {
  // Calculate team stats with memoization
  const { completedCalls, thisWeekCalls, teamAvgScore, repScores, repsBelow70, scoreDistribution } = useMemo(() => {
    const completedCalls = recentCalls.filter((c) => c.status === 'complete');
    const thisWeekCalls = completedCalls.filter(
      (c) =>
        new Date(c.call_date) >
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    const teamAvgScore =
      completedCalls.length > 0
        ? completedCalls.reduce((sum, c) => sum + (c.overall_score || 0), 0) /
          completedCalls.length
        : 0;

    // Group calls by rep
    const repCalls: Record<string, Call[]> = {};
    completedCalls.forEach((call) => {
      if (!repCalls[call.rep_id]) repCalls[call.rep_id] = [];
      repCalls[call.rep_id].push(call);
    });

    // Calculate rep scores
    const repScores = Object.entries(repCalls).map(([repId, calls]) => ({
      repId,
      avgScore:
        calls.reduce((sum, c) => sum + (c.overall_score || 0), 0) / calls.length,
      callCount: calls.length,
    }));

    const repsBelow70 = repScores.filter((r) => r.avgScore < 70).length;

    // Score distribution
    const scoreDistribution = {
      '90-100': completedCalls.filter((c) => (c.overall_score || 0) >= 90).length,
      '80-89': completedCalls.filter(
        (c) => (c.overall_score || 0) >= 80 && (c.overall_score || 0) < 90
      ).length,
      '70-79': completedCalls.filter(
        (c) => (c.overall_score || 0) >= 70 && (c.overall_score || 0) < 80
      ).length,
      '60-69': completedCalls.filter(
        (c) => (c.overall_score || 0) >= 60 && (c.overall_score || 0) < 70
      ).length,
      'Below 60': completedCalls.filter((c) => (c.overall_score || 0) < 60).length,
    };

    return { completedCalls, thisWeekCalls, teamAvgScore, repScores, repsBelow70, scoreDistribution };
  }, [recentCalls]);

  // Calculate phase averages across team with memoization
  const teamPhaseScores = useMemo(() => {
    const phaseScores: Record<string, number[]> = {};
    Object.values(scores).forEach((callScores) => {
      (callScores as Array<{ phase: string; score: number }>).forEach((s) => {
        if (!phaseScores[s.phase]) phaseScores[s.phase] = [];
        phaseScores[s.phase].push(s.score);
      });
    });

    return Object.entries(phaseScores).map(([phase, phaseScoreList]) => ({
      phase,
      label: phase.charAt(0).toUpperCase() + phase.slice(1),
      score: phaseScoreList.reduce((a, b) => a + b, 0) / phaseScoreList.length,
    }));
  }, [scores]);

  // Identify common issues (lowest team averages)
  const commonIssues = [...teamPhaseScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Team Average"
          value={teamAvgScore.toFixed(1)}
          suffix="%"
          color={teamAvgScore >= 80 ? 'green' : teamAvgScore >= 70 ? 'yellow' : 'red'}
        />
        <StatCard
          title="Calls This Week"
          value={thisWeekCalls.length.toString()}
          suffix=""
          color="blue"
        />
        <StatCard
          title="Reps Below 70%"
          value={repsBelow70.toString()}
          suffix=""
          color={repsBelow70 === 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Total Reps"
          value={repScores.length.toString()}
          suffix=""
          color="gray"
        />
      </div>

      {/* Score Distribution and Team Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="card">
          <h3 className="card-header">Score Distribution</h3>
          <div className="space-y-3">
            {Object.entries(scoreDistribution).map(([range, count]) => {
              const total = completedCalls.length || 1;
              const percentage = (count / total) * 100;
              return (
                <div key={range} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{range}</span>
                    <span className="text-gray-500">{count} calls</span>
                  </div>
                  <div className="h-4 bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full transition-all ${getBarColor(range)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Common Team Issues */}
        <div className="card">
          <h3 className="card-header">Common Team Issues</h3>
          {commonIssues.length > 0 ? (
            <div className="space-y-3">
              {commonIssues.map((issue, index) => (
                <div
                  key={issue.phase}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-sm font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{issue.label} Phase</p>
                      <p className="text-sm text-gray-600">
                        Team-wide coaching opportunity
                      </p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${getScoreColor(issue.score)}`}>
                    {issue.score.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No data available yet
            </p>
          )}
        </div>
      </div>

      {/* Team Leaderboard */}
      <div className="card">
        <h3 className="card-header">Team Leaderboard</h3>
        {repScores.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Rep</th>
                  <th>Calls</th>
                  <th>Avg Score</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {repScores
                  .sort((a, b) => b.avgScore - a.avgScore)
                  .map((rep, index) => (
                    <tr key={rep.repId}>
                      <td>
                        <span className="flex items-center justify-center w-6 h-6 bg-gray-100 text-sm font-bold">
                          {index + 1}
                        </span>
                      </td>
                      <td className="font-medium">{rep.repId.slice(0, 8)}...</td>
                      <td>{rep.callCount}</td>
                      <td>
                        <span className={`font-semibold ${getScoreColor(rep.avgScore)}`}>
                          {rep.avgScore.toFixed(0)}%
                        </span>
                      </td>
                      <td>
                        <StatusIndicator score={rep.avgScore} />
                      </td>
                      <td>
                        <button className="text-primary hover:text-primary-600 text-sm">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No team data available yet
          </p>
        )}
      </div>

      {/* Alerts Panel */}
      <div className="card">
        <h3 className="card-header">Alerts & Coaching Opportunities</h3>
        <div className="space-y-3">
          {repsBelow70 > 0 && (
            <AlertItem
              type="warning"
              title={`${repsBelow70} rep(s) scoring below 70%`}
              description="Consider scheduling 1:1 coaching sessions"
            />
          )}
          {commonIssues.length > 0 && commonIssues[0].score < 70 && (
            <AlertItem
              type="info"
              title={`Team ${commonIssues[0].label} scores need attention`}
              description={`Average: ${commonIssues[0].score.toFixed(0)}%. Consider team training.`}
            />
          )}
          {completedCalls.length === 0 && (
            <AlertItem
              type="neutral"
              title="No scored calls yet"
              description="Set up HubSpot sync or have reps upload calls to start tracking"
            />
          )}
        </div>
      </div>

      {/* Recent Team Calls */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="card-header mb-0">Recent Team Calls</h3>
          <Link href="/calls" className="text-sm text-primary hover:text-primary-600">
            View all calls
          </Link>
        </div>
        {recentCalls.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Rep</th>
                  <th>Contact</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentCalls.slice(0, 10).map((call) => (
                  <tr key={call.id}>
                    <td>{format(new Date(call.call_date), 'MMM d, h:mm a')}</td>
                    <td>{call.rep_id.slice(0, 8)}...</td>
                    <td>{call.contact_name || 'Unknown'}</td>
                    <td>
                      {call.overall_score !== null ? (
                        <span className={`font-semibold ${getScoreColor(call.overall_score)}`}>
                          {call.overall_score.toFixed(0)}%
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <StatusBadge status={call.status} />
                    </td>
                    <td>
                      <Link
                        href={`/calls/${call.id}`}
                        className="text-primary hover:text-primary-600 text-sm"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No calls to display
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/settings" className="card hover:border-primary transition-colors">
          <h4 className="font-semibold text-gray-900">HubSpot Sync</h4>
          <p className="text-sm text-gray-600 mt-1">
            Configure automatic call syncing
          </p>
        </Link>
        <Link href="/scripts" className="card hover:border-primary transition-colors">
          <h4 className="font-semibold text-gray-900">Manage Scripts</h4>
          <p className="text-sm text-gray-600 mt-1">
            View and update sales scripts
          </p>
        </Link>
        <Link href="/calls" className="card hover:border-primary transition-colors">
          <h4 className="font-semibold text-gray-900">Review Calls</h4>
          <p className="text-sm text-gray-600 mt-1">
            Listen to calls and add notes
          </p>
        </Link>
      </div>
    </div>
  );
});

function getBarColor(range: string): string {
  switch (range) {
    case '90-100':
      return 'bg-green-500';
    case '80-89':
      return 'bg-green-400';
    case '70-79':
      return 'bg-yellow-500';
    case '60-69':
      return 'bg-orange-500';
    default:
      return 'bg-red-500';
  }
}
