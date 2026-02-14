import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { format } from 'date-fns';
import { getProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppLayout } from '@/components/layout/app-layout';
import { CallRecordingPlayer } from '@/components/calls/call-recording-player';
import { ScoreCard } from '@/components/dashboard/score-card';
import { FeedbackList } from '@/components/dashboard/feedback-list';
import { ScoreCallButton } from '@/components/calls/score-call-button';
import { CallStatusPoller } from '@/components/calls/call-status-poller';
import { SpeakerCorrection } from '@/components/calls/speaker-correction';
import { CallErrorState } from '@/components/calls/call-error-state';
import { CallOutcomeSelector, OutcomeBadge } from '@/components/calls/call-outcome-selector';
import { CallRepSelector } from '@/components/calls/call-rep-selector';
import type { Score, TranscriptSegment } from '@/types/database';
import { StatusBadge } from '@/components/ui/shared';
import { getScoreColor, formatDuration } from '@/lib/utils/format';

interface CallDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CallDetailPage({ params }: CallDetailPageProps) {
  const { id } = await params;
  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  // Use admin client to bypass RLS issues
  const adminClient = createAdminClient();
  const isManager = profile.role === 'manager' || profile.role === 'admin';

  // Fetch call
  const { data: call, error } = await adminClient
    .from('calls')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !call) {
    notFound();
  }

  // Check access
  if (!isManager && call.rep_id !== profile.id) {
    notFound();
  }

  // Fetch scores
  const { data: scores } = await adminClient
    .from('scores')
    .select('*')
    .eq('call_id', id);

  // Fetch notes
  const { data: notes } = await adminClient
    .from('call_notes')
    .select('*')
    .eq('call_id', id)
    .order('created_at', { ascending: false });

  // Fetch reps for managers to reassign calls
  let reps: { id: string; full_name: string | null; email: string }[] = [];
  if (isManager) {
    const { data: repData } = await adminClient
      .from('profiles')
      .select('id, full_name, email')
      .order('full_name');
    reps = repData || [];
  }

  // Calculate phase scores for chart
  const phaseScores = (scores || []).map((s) => ({
    phase: s.phase,
    label: s.phase.charAt(0).toUpperCase() + s.phase.slice(1),
    score: s.score,
  }));

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/calls" className="hover:text-primary">
                Calls
              </Link>
              <span>/</span>
              <span>Call Details</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {call.contact_name || 'Unknown Contact'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {format(new Date(call.call_date), 'MMMM d, yyyy h:mm a')}
              {call.duration_seconds && ` - ${formatDuration(call.duration_seconds)}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={call.status} />
            {call.overall_score !== null && (
              <div className={`text-3xl font-bold ${getScoreColor(call.overall_score)}`}>
                {call.overall_score.toFixed(0)}%
              </div>
            )}
          </div>
        </div>

        {/* Processing Status */}
        {call.status !== 'complete' && call.status !== 'error' && (
          <CallStatusPoller callId={id} status={call.status} />
        )}

        {/* Error Status */}
        {call.status === 'error' && (
          <CallErrorState
            callId={id}
            errorMessage={call.error_message}
            hasTranscript={!!call.transcript}
          />
        )}

        {/* Summary TLDR */}
        {call.summary && call.status === 'complete' && (
          <div className="bg-blue-50 border border-blue-200 p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Summary
            </h3>
            <p className="text-sm text-blue-800">{call.summary}</p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Transcript */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recording & Transcript */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="card-header mb-0">
                  {call.recording_url ? 'Recording & Transcript' : 'Transcript'}
                </h3>
                {call.recording_url && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    Audio Available
                  </span>
                )}
              </div>
              {call.transcript ? (
                <>
                  <SpeakerCorrection
                    callId={id}
                    transcript={call.transcript as TranscriptSegment[]}
                  />
                  <div className="mt-4">
                    <CallRecordingPlayer
                      recordingUrl={call.recording_url}
                      transcript={call.transcript as TranscriptSegment[]}
                    />
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  {call.status === 'pending' || call.status === 'transcribing'
                    ? 'Transcript is being generated...'
                    : 'No transcript available'}
                </p>
              )}
            </div>

            {/* Detailed Feedback */}
            {scores && scores.length > 0 && (
              <div className="card">
                <h3 className="card-header">Detailed Feedback</h3>
                <FeedbackList scores={scores as Score[]} />
              </div>
            )}
          </div>

          {/* Right Column - Scores & Info */}
          <div className="space-y-6">
            {/* Score Breakdown */}
            {phaseScores.length > 0 && (
              <div className="card">
                <h3 className="card-header">CLOSER Breakdown</h3>
                <ScoreCard scores={phaseScores} />
              </div>
            )}

            {/* Call Info */}
            <div className="card">
              <h3 className="card-header">Call Information</h3>

              {/* Rep Reassignment for Managers */}
              {isManager && reps.length > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <CallRepSelector
                    callId={id}
                    currentRepId={call.rep_id}
                    reps={reps}
                  />
                </div>
              )}

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Source</dt>
                  <dd className="font-medium">
                    {call.source === 'hubspot' ? 'HubSpot' : call.source === 'ringover' ? 'Ringover' : 'Manual Upload'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Duration</dt>
                  <dd className="font-medium">
                    {call.duration_seconds
                      ? formatDuration(call.duration_seconds)
                      : '-'}
                  </dd>
                </div>
                {call.contact_phone && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="font-medium">{call.contact_phone}</dd>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <dt className="text-gray-500">Outcome</dt>
                  <dd>
                    {call.outcome ? (
                      <OutcomeBadge outcome={call.outcome} />
                    ) : (
                      <span className="text-gray-400">Not set</span>
                    )}
                  </dd>
                </div>
                {call.hubspot_call_id && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">HubSpot ID</dt>
                    <dd className="font-medium text-xs font-mono">
                      {call.hubspot_call_id}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Outcome Selector */}
            {call.status === 'complete' && (
              <div className="card">
                <h3 className="card-header">Call Outcome</h3>
                <CallOutcomeSelector callId={id} currentOutcome={call.outcome} />
                <p className="text-xs text-gray-500 mt-3">
                  Track whether this call resulted in a sale to see how scores correlate with conversions.
                </p>
              </div>
            )}

            {/* Notes Section */}
            <div className="card">
              <h3 className="card-header">Notes</h3>
              {notes && notes.length > 0 ? (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 border ${
                        note.is_flagged
                          ? 'border-red-200 bg-red-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <p className="text-sm text-gray-700">{note.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {format(new Date(note.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No notes yet</p>
              )}
              {isManager && (
                <AddNoteForm callId={id} />
              )}
            </div>

            {/* Actions */}
            {(call.status === 'scoring' || (call.status === 'complete' && !scores?.length)) && (
              <ScoreCallButton callId={id} status={call.status} />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function AddNoteForm({ callId }: { callId: string }) {
  return (
    <form
      action={async (formData) => {
        'use server';
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const { createClient } = await import('@/lib/supabase/server');

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const content = formData.get('content') as string;
        if (!content?.trim()) return;

        const adminClient = createAdminClient();
        await adminClient.from('call_notes').insert({
          call_id: callId,
          author_id: user.id,
          content: content.trim(),
        });

        const { revalidatePath } = await import('next/cache');
        revalidatePath(`/calls/${callId}`);
      }}
      className="mt-4"
    >
      <textarea
        name="content"
        className="input min-h-[80px]"
        placeholder="Add a note..."
      />
      <div className="flex items-center justify-between mt-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="flagged" className="border-gray-300" />
          <span className="text-gray-600">Flag for review</span>
        </label>
        <button type="submit" className="btn-primary btn-sm">
          Add Note
        </button>
      </div>
    </form>
  );
}


