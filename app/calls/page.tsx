import Link from 'next/link';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { getProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppLayout } from '@/components/layout/app-layout';
import { CallsFilter } from '@/components/calls/calls-filter';
import { OutcomeBadge } from '@/components/calls/call-outcome-selector';

interface CallsPageProps {
  searchParams: Promise<{
    search?: string;
    scoreMin?: string;
    scoreMax?: string;
    status?: string;
    outcome?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function CallsPage({ searchParams }: CallsPageProps) {
  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  const params = await searchParams;

  // Use admin client to bypass RLS issues
  const adminClient = createAdminClient();
  const isManager = profile.role === 'manager' || profile.role === 'admin';

  // Build query with filters
  let query = adminClient
    .from('calls')
    .select('*')
    .order('call_date', { ascending: false });

  if (!isManager) {
    query = query.eq('rep_id', profile.id);
  }

  // Apply search filter
  if (params.search) {
    query = query.ilike('contact_name', `%${params.search}%`);
  }

  // Apply score filters
  if (params.scoreMin) {
    query = query.gte('overall_score', parseInt(params.scoreMin));
  }
  if (params.scoreMax) {
    query = query.lte('overall_score', parseInt(params.scoreMax));
  }

  // Apply status filter
  if (params.status) {
    query = query.eq('status', params.status as 'pending' | 'transcribing' | 'scoring' | 'complete' | 'error');
  }

  // Apply outcome filter
  if (params.outcome) {
    if (params.outcome === 'none') {
      query = query.is('outcome', null);
    } else {
      query = query.eq('outcome', params.outcome);
    }
  }

  // Apply date filters
  if (params.dateFrom) {
    query = query.gte('call_date', params.dateFrom);
  }
  if (params.dateTo) {
    query = query.lte('call_date', `${params.dateTo}T23:59:59`);
  }

  const { data: calls } = await query.limit(100);

  // Calculate stats
  const completedCalls = (calls || []).filter(c => c.status === 'complete' && c.overall_score !== null);
  const avgScore = completedCalls.length > 0
    ? completedCalls.reduce((sum, c) => sum + (c.overall_score || 0), 0) / completedCalls.length
    : 0;
  const closedCalls = (calls || []).filter(c =>
    c.outcome === 'annual' || c.outcome === 'monthly' || c.outcome === 'trial'
  );
  const conversionRate = completedCalls.length > 0
    ? (closedCalls.length / completedCalls.length) * 100
    : 0;

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isManager ? 'All Calls' : 'My Calls'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              View and manage call recordings and scores
            </p>
          </div>
          <Link href="/calls/upload" className="btn-primary">
            Upload Call
          </Link>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card py-3 px-4">
            <p className="text-sm text-gray-500">Total Calls</p>
            <p className="text-2xl font-bold text-gray-900">{calls?.length || 0}</p>
          </div>
          <div className="card py-3 px-4">
            <p className="text-sm text-gray-500">Avg Score</p>
            <p className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
              {avgScore > 0 ? `${avgScore.toFixed(0)}%` : '-'}
            </p>
          </div>
          <div className="card py-3 px-4">
            <p className="text-sm text-gray-500">Closed Deals</p>
            <p className="text-2xl font-bold text-green-600">{closedCalls.length}</p>
          </div>
          <div className="card py-3 px-4">
            <p className="text-sm text-gray-500">Conversion Rate</p>
            <p className="text-2xl font-bold text-blue-600">
              {conversionRate > 0 ? `${conversionRate.toFixed(0)}%` : '-'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <CallsFilter showRepFilter={isManager} />

        {/* Calls Table */}
        <div className="card">
          {calls && calls.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    {isManager && <th>Rep</th>}
                    <th>Contact</th>
                    <th>Duration</th>
                    <th>Outcome</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => (
                    <tr key={call.id}>
                      <td>
                        {format(new Date(call.call_date), 'MMM d, yyyy')}
                        <span className="text-xs text-gray-500 block">
                          {format(new Date(call.call_date), 'h:mm a')}
                        </span>
                      </td>
                      {isManager && (
                        <td className="font-medium text-xs">
                          {call.rep_id.slice(0, 8)}...
                        </td>
                      )}
                      <td className="font-medium">{call.contact_name || 'Unknown'}</td>
                      <td className="text-gray-600">
                        {call.duration_seconds
                          ? formatDuration(call.duration_seconds)
                          : '-'}
                      </td>
                      <td>
                        <OutcomeBadge outcome={call.outcome} />
                      </td>
                      <td>
                        <StatusBadge status={call.status} />
                      </td>
                      <td>
                        {call.overall_score !== null ? (
                          <span
                            className={`font-bold text-lg ${getScoreColor(call.overall_score)}`}
                          >
                            {call.overall_score.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/calls/${call.id}`}
                          className="text-primary hover:text-primary-600 font-medium"
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
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No calls found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {Object.keys(params).length > 0
                  ? 'Try adjusting your filters.'
                  : 'Upload a call recording or sync from HubSpot to get started.'}
              </p>
              {Object.keys(params).length === 0 && (
                <div className="mt-6 flex justify-center gap-4">
                  <Link href="/calls/upload" className="btn-primary">
                    Upload Call
                  </Link>
                  {isManager && (
                    <Link href="/settings" className="btn-secondary">
                      Configure HubSpot
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    pending: 'badge bg-gray-100 text-gray-800',
    transcribing: 'badge bg-blue-100 text-blue-800',
    scoring: 'badge bg-yellow-100 text-yellow-800',
    complete: 'badge bg-green-100 text-green-800',
    error: 'badge bg-red-100 text-red-800',
  };

  return (
    <span className={classes[status] || classes.pending}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
