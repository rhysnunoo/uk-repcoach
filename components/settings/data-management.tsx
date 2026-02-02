'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { Call, PracticeSession, Profile } from '@/types/database';

interface DataManagementProps {
  calls: (Call & { rep?: Profile })[];
  practiceSessions: (PracticeSession & { rep?: Profile })[];
}

export function DataManagement({ calls, practiceSessions }: DataManagementProps) {
  const [deletingCallId, setDeletingCallId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [callsToShow, setCallsToShow] = useState(10);
  const [sessionsToShow, setSessionsToShow] = useState(10);
  const [callFilter, setCallFilter] = useState<'all' | 'error' | 'complete'>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredCalls = calls.filter((call) => {
    if (callFilter === 'all') return true;
    return call.status === callFilter;
  });

  const deleteCall = async (callId: string) => {
    if (!confirm('Are you sure you want to delete this call? This action cannot be undone.')) {
      return;
    }

    setDeletingCallId(callId);
    setMessage(null);

    try {
      const response = await fetch(`/api/calls/${callId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Call deleted successfully' });
        // Reload page to refresh data
        window.location.reload();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete call' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setDeletingCallId(null);
    }
  };

  const deletePracticeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this practice session? This action cannot be undone.')) {
      return;
    }

    setDeletingSessionId(sessionId);
    setMessage(null);

    try {
      const response = await fetch(`/api/practice/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Practice session deleted successfully' });
        // Reload page to refresh data
        window.location.reload();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete practice session' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setDeletingSessionId(null);
    }
  };

  const deleteAllErrorCalls = async () => {
    const errorCalls = calls.filter((c) => c.status === 'error');
    if (errorCalls.length === 0) {
      setMessage({ type: 'error', text: 'No error calls to delete' });
      return;
    }

    if (!confirm(`Are you sure you want to delete all ${errorCalls.length} error calls? This action cannot be undone.`)) {
      return;
    }

    setMessage(null);
    let deleted = 0;
    let failed = 0;

    for (const call of errorCalls) {
      try {
        const response = await fetch(`/api/calls/${call.id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          deleted++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setMessage({
      type: failed > 0 ? 'error' : 'success',
      text: `Deleted ${deleted} calls${failed > 0 ? `, ${failed} failed` : ''}`,
    });

    if (deleted > 0) {
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="card-header">Data Management</h3>
        <p className="text-sm text-gray-600 mb-4">
          Manage call uploads and practice sessions. Only admins can delete data.
        </p>

        {message && (
          <div
            className={`p-4 mb-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* Calls Management */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Call Uploads ({calls.length} total)</h4>
          <div className="flex items-center gap-2">
            <select
              value={callFilter}
              onChange={(e) => setCallFilter(e.target.value as 'all' | 'error' | 'complete')}
              className="input text-sm"
            >
              <option value="all">All Calls</option>
              <option value="error">Error Only</option>
              <option value="complete">Complete Only</option>
            </select>
            {callFilter === 'error' && calls.filter((c) => c.status === 'error').length > 0 && (
              <button
                onClick={deleteAllErrorCalls}
                className="btn-secondary btn-sm text-red-600 hover:text-red-700"
              >
                Delete All Errors
              </button>
            )}
          </div>
        </div>

        {filteredCalls.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="table text-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Rep</th>
                    <th>Contact</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCalls.slice(0, callsToShow).map((call) => (
                    <tr key={call.id}>
                      <td>{format(new Date(call.call_date), 'MMM d, yyyy')}</td>
                      <td>{call.rep?.full_name || call.rep?.email || 'Unknown'}</td>
                      <td>{call.contact_name || 'Unknown'}</td>
                      <td>
                        <span className="badge bg-gray-100 text-gray-800">{call.source}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            call.status === 'complete'
                              ? 'bg-green-100 text-green-800'
                              : call.status === 'error'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {call.status}
                        </span>
                      </td>
                      <td>{call.overall_score ? `${call.overall_score}%` : '-'}</td>
                      <td>
                        <button
                          onClick={() => deleteCall(call.id)}
                          disabled={deletingCallId === call.id}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          {deletingCallId === call.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredCalls.length > callsToShow && (
              <button
                onClick={() => setCallsToShow((prev) => prev + 10)}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800"
              >
                Show more ({filteredCalls.length - callsToShow} remaining)
              </button>
            )}
          </>
        ) : (
          <p className="text-gray-500 text-sm">No calls found</p>
        )}
      </div>

      {/* Practice Sessions Management */}
      <div className="card">
        <h4 className="font-medium text-gray-900 mb-4">
          Practice Sessions ({practiceSessions.length} total)
        </h4>

        {practiceSessions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="table text-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Rep</th>
                    <th>Persona</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {practiceSessions.slice(0, sessionsToShow).map((session) => (
                    <tr key={session.id}>
                      <td>{format(new Date(session.started_at), 'MMM d, yyyy h:mm a')}</td>
                      <td>{session.rep?.full_name || session.rep?.email || 'Unknown'}</td>
                      <td className="capitalize">{session.persona.replace(/_/g, ' ')}</td>
                      <td>
                        <span
                          className={`badge ${
                            session.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : session.status === 'abandoned'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>
                      <td>{session.final_score ? `${session.final_score}%` : '-'}</td>
                      <td>
                        <button
                          onClick={() => deletePracticeSession(session.id)}
                          disabled={deletingSessionId === session.id}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          {deletingSessionId === session.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {practiceSessions.length > sessionsToShow && (
              <button
                onClick={() => setSessionsToShow((prev) => prev + 10)}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800"
              >
                Show more ({practiceSessions.length - sessionsToShow} remaining)
              </button>
            )}
          </>
        ) : (
          <p className="text-gray-500 text-sm">No practice sessions found</p>
        )}
      </div>
    </div>
  );
}
