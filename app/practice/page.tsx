import Link from 'next/link';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { getProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppLayout } from '@/components/layout/app-layout';
import { StartPracticeForm } from '@/components/practice/start-practice-form';

export default async function PracticePage() {
  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  const adminClient = createAdminClient();

  // Fetch scripts (use admin client to bypass RLS issues)
  const { data: scripts } = await adminClient
    .from('scripts')
    .select('id, name, course')
    .eq('is_active', true)
    .order('course');

  // Fetch recent practice sessions
  const { data: sessions } = await adminClient
    .from('practice_sessions')
    .select('*')
    .eq('rep_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Check for active session
  const activeSession = sessions?.find((s) => s.status === 'active');

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Practice Mode</h1>
          <p className="mt-1 text-sm text-gray-600">
            Practice your sales pitch with AI-powered prospect simulations
          </p>
        </div>

        {/* Active Session Alert */}
        {activeSession && (
          <div className="bg-blue-50 border border-blue-200 p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900">
                You have an active practice session
              </p>
              <p className="text-sm text-blue-700">
                {formatPersona(activeSession.persona)} - Started{' '}
                {format(new Date(activeSession.started_at), 'h:mm a')}
              </p>
            </div>
            <Link
              href={`/practice/${activeSession.id}`}
              className="btn-primary"
            >
              Continue Session
            </Link>
          </div>
        )}

        {/* Quick Practice Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card">
            <h3 className="card-header">Start New Practice Session</h3>
            <p className="text-sm text-gray-600 mb-4">
              Full role-play session with AI-powered prospect simulation
            </p>
            <StartPracticeForm scripts={scripts || []} />
          </div>

          <div className="card">
            <h3 className="card-header">Objection Handling Drills</h3>
            <p className="text-sm text-gray-600 mb-4">
              Quick-fire practice handling common objections with instant feedback
            </p>
            <Link href="/practice/drills" className="btn-secondary inline-block">
              Start Objection Drill
            </Link>
          </div>
        </div>

        {/* Team Challenges */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="card-header">Team Challenges</h3>
              <p className="text-sm text-gray-600">
                Compete with your team on practice challenges and climb the leaderboard
              </p>
            </div>
            <Link href="/practice/challenges" className="btn-primary">
              View Challenges
            </Link>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="card">
          <h3 className="card-header">Recent Practice Sessions</h3>
          {sessions && sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Persona</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td>
                        {format(new Date(session.created_at), 'MMM d, h:mm a')}
                      </td>
                      <td>{formatPersona(session.persona)}</td>
                      <td>
                        <StatusBadge status={session.status} />
                      </td>
                      <td>
                        {session.final_score !== null ? (
                          <span
                            className={`font-semibold ${getScoreColor(session.final_score)}`}
                          >
                            {session.final_score.toFixed(0)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/practice/${session.id}`}
                          className="text-primary hover:text-primary-600"
                        >
                          {session.status === 'active' ? 'Continue' : 'View'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No practice sessions yet. Start your first session above!
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    active: 'badge bg-blue-100 text-blue-800',
    completed: 'badge bg-green-100 text-green-800',
    abandoned: 'badge bg-gray-100 text-gray-800',
  };

  return (
    <span className={classes[status] || classes.active}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function formatPersona(persona: string): string {
  return persona
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 70) return 'text-yellow-600';
  return 'text-red-600';
}
