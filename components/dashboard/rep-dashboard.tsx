'use client';

import { useMemo, memo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Profile, Call, PracticeSession, Score } from '@/types/database';
import { ScoreCard } from './score-card';
import { ScoreTrends } from './score-trends';
import { WeakSpotsCard } from './weak-spots-card';
import { StatCard, StatusBadge } from '@/components/ui/shared';
import { getScoreColor, formatDuration, formatPersona } from '@/lib/utils/format';

interface RepDashboardProps {
  profile: Profile;
  recentCalls: Call[];
  practiceSessions: PracticeSession[];
  scores: Record<string, unknown[]>;
}

export const RepDashboard = memo(function RepDashboard({
  recentCalls,
  practiceSessions,
  scores,
}: RepDashboardProps) {
  // Calculate stats with memoization
  const completedCalls = useMemo(() =>
    recentCalls.filter((c) => c.status === 'complete'),
    [recentCalls]
  );

  const avgScore = useMemo(() =>
    completedCalls.length > 0
      ? completedCalls.reduce((sum, c) => sum + (c.overall_score || 0), 0) /
        completedCalls.length
      : 0,
    [completedCalls]
  );

  const thisWeekCalls = useMemo(() =>
    completedCalls.filter(
      (c) =>
        new Date(c.call_date) >
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ),
    [completedCalls]
  );

  const thisWeekPractice = useMemo(() =>
    practiceSessions.filter(
      (p) =>
        new Date(p.created_at) >
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ),
    [practiceSessions]
  );

  // Calculate phase scores with memoization
  const { avgPhaseScores, improvementAreas } = useMemo(() => {
    const phaseScores: Record<string, number[]> = {};
    Object.values(scores).forEach((callScores) => {
      (callScores as Array<{ phase: string; score: number }>).forEach((s) => {
        if (!phaseScores[s.phase]) phaseScores[s.phase] = [];
        phaseScores[s.phase].push(s.score);
      });
    });

    const avgPhaseScores = Object.entries(phaseScores).map(([phase, phaseScoreList]) => ({
      phase,
      label: phase.charAt(0).toUpperCase() + phase.slice(1),
      score: phaseScoreList.reduce((a, b) => a + b, 0) / phaseScoreList.length,
    }));

    const improvementAreas = [...avgPhaseScores]
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    return { avgPhaseScores, improvementAreas };
  }, [scores]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Average Score"
          value={avgScore.toFixed(1)}
          suffix="%"
          trend={null}
          color={avgScore >= 80 ? 'green' : avgScore >= 70 ? 'yellow' : 'red'}
        />
        <StatCard
          title="Calls This Week"
          value={thisWeekCalls.length.toString()}
          suffix=""
          trend={null}
          color="blue"
        />
        <StatCard
          title="Practice Sessions"
          value={thisWeekPractice.length.toString()}
          suffix=" this week"
          trend={null}
          color="purple"
        />
        <StatCard
          title="Total Calls"
          value={completedCalls.length.toString()}
          suffix=" scored"
          trend={null}
          color="gray"
        />
      </div>

      {/* Score Trends - Full Width */}
      <div className="card">
        <h3 className="card-header">Score Trends (30 Days)</h3>
        <ScoreTrends
          calls={completedCalls.map(c => ({
            id: c.id,
            overall_score: c.overall_score,
            call_date: c.call_date,
          }))}
          scores={Object.values(scores).flat() as Score[]}
        />
      </div>

      {/* CLOSER Breakdown */}
      <div className="card">
        <h3 className="card-header">CLOSER Framework Breakdown</h3>
        <ScoreCard scores={avgPhaseScores} />
      </div>

      {/* Weak Spots & Improvement Areas */}
      <WeakSpotsCard />

      {/* Recent Calls Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="card-header mb-0">Recent Calls</h3>
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
                  <th>Contact</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentCalls.slice(0, 5).map((call) => (
                  <tr key={call.id}>
                    <td>{format(new Date(call.call_date), 'MMM d, yyyy')}</td>
                    <td>{call.contact_name || 'Unknown'}</td>
                    <td>
                      {call.duration_seconds
                        ? formatDuration(call.duration_seconds)
                        : '-'}
                    </td>
                    <td>
                      <StatusBadge status={call.status} />
                    </td>
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
                      <Link
                        href={`/calls/${call.id}`}
                        className="text-primary hover:text-primary-600 text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No calls yet.</p>
            <Link href="/calls/upload" className="text-primary hover:text-primary-600">
              Upload your first call
            </Link>
          </div>
        )}
      </div>

      {/* Practice Sessions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="card-header mb-0">Recent Practice Sessions</h3>
          <Link href="/practice" className="btn-primary btn-sm">
            Start Practice
          </Link>
        </div>
        {practiceSessions.length > 0 ? (
          <div className="space-y-2">
            {practiceSessions.slice(0, 3).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {formatPersona(session.persona)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(session.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={session.status} />
                  {session.final_score !== null && (
                    <span className={`font-semibold ${getScoreColor(session.final_score)}`}>
                      {session.final_score.toFixed(0)}%
                    </span>
                  )}
                  <Link
                    href={`/practice/${session.id}`}
                    className="text-primary hover:text-primary-600 text-sm"
                  >
                    {session.status === 'active' ? 'Continue' : 'View'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No practice sessions yet.</p>
            <p className="text-sm">Start practicing to improve your sales skills!</p>
          </div>
        )}
      </div>
    </div>
  );
});

