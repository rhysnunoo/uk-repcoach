import { redirect } from 'next/navigation';
import { getProfile, createClient, getUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppLayout } from '@/components/layout/app-layout';
import { RepDashboard } from '@/components/dashboard/rep-dashboard';
import { ManagerDashboard } from '@/components/dashboard/manager-dashboard';
import { FailedCallsAlert } from '@/components/dashboard/failed-calls-alert';
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';

interface DashboardPageProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { view } = await searchParams;
  const profile = await getProfile();

  if (!profile) {
    // Check if user is authenticated but has no profile
    const user = await getUser();
    if (user) {
      // User exists but profile creation failed - sign them out to break redirect loop
      const supabase = await createClient();
      await supabase.auth.signOut();
    }
    redirect('/login?error=profile_creation_failed');
  }

  // Use admin client to bypass RLS issues
  const adminClient = createAdminClient();
  const isManager = profile.role === 'manager' || profile.role === 'admin';

  // For managers, default to team view unless they explicitly select personal
  const showPersonalView = isManager ? view === 'personal' : true;

  // Fetch calls for last 30 days (for trends)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all calls for managers (for team view)
  const { data: allCalls } = isManager
    ? await adminClient
        .from('calls')
        .select('*')
        .gte('call_date', thirtyDaysAgo)
        .order('call_date', { ascending: false })
        .limit(100)
    : { data: null };

  // Fetch personal calls (for reps, and for managers in personal view)
  const { data: personalCalls } = await adminClient
    .from('calls')
    .select('*')
    .eq('rep_id', profile.id)
    .gte('call_date', thirtyDaysAgo)
    .order('call_date', { ascending: false })
    .limit(100);

  // Determine which calls to use for scores lookup
  const recentCalls = showPersonalView ? personalCalls : allCalls;

  // Fetch recent practice sessions (always personal)
  const { data: practiceSessions } = await adminClient
    .from('practice_sessions')
    .select('*')
    .eq('rep_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch scores for recent calls
  type ScoresByCallId = Record<string, Array<{ phase: string; score: number; call_id: string }>>;
  let scores: ScoresByCallId = {};
  if (recentCalls && recentCalls.length > 0) {
    const callIds = recentCalls.map((c) => c.id);
    const { data: scoreData } = await adminClient
      .from('scores')
      .select('*')
      .in('call_id', callIds);

    if (scoreData) {
      scores = scoreData.reduce((acc, score) => {
        if (!acc[score.call_id]) acc[score.call_id] = [];
        acc[score.call_id].push(score);
        return acc;
      }, {} as ScoresByCallId);
    }
  }

  // Also fetch scores for personal calls if in team view (for manager's personal stats)
  let personalScores: ScoresByCallId = {};
  if (isManager && !showPersonalView && personalCalls && personalCalls.length > 0) {
    const personalCallIds = personalCalls.map((c) => c.id);
    const { data: personalScoreData } = await adminClient
      .from('scores')
      .select('*')
      .in('call_id', personalCallIds);

    if (personalScoreData) {
      personalScores = personalScoreData.reduce((acc, score) => {
        if (!acc[score.call_id]) acc[score.call_id] = [];
        acc[score.call_id].push(score);
        return acc;
      }, {} as ScoresByCallId);
    }
  }

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isManager
                ? (showPersonalView ? 'My Performance' : 'Team Dashboard')
                : 'My Dashboard'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {isManager
                ? (showPersonalView
                    ? 'Your personal call performance and practice sessions'
                    : 'Overview of team performance and coaching opportunities')
                : 'Track your calls, scores, and practice sessions'}
            </p>
          </div>

          {isManager && (
            <DashboardTabs currentView={showPersonalView ? 'personal' : 'team'} />
          )}
        </div>

        <FailedCallsAlert />

        {isManager && !showPersonalView ? (
          <ManagerDashboard
            profile={profile}
            recentCalls={allCalls || []}
            scores={scores}
          />
        ) : (
          <RepDashboard
            profile={profile}
            recentCalls={personalCalls || []}
            practiceSessions={practiceSessions || []}
            scores={showPersonalView ? scores : personalScores}
          />
        )}
      </div>
    </AppLayout>
  );
}
