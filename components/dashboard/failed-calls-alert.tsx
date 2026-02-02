'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

interface FailedCall {
  id: string;
  contact_name: string | null;
  call_date: string;
  error_message: string | null;
  status: string;
  has_transcript: boolean;
}

export function FailedCallsAlert() {
  const [failedCalls, setFailedCalls] = useState<FailedCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    fetchFailedCalls();
  }, []);

  const fetchFailedCalls = async () => {
    try {
      const response = await fetch('/api/calls?status=error&limit=5');
      if (response.ok) {
        const data = await response.json();
        setFailedCalls(data.calls || []);
      }
    } catch (error) {
      console.error('Failed to fetch failed calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (callId: string, hasTranscript: boolean) => {
    setRetrying(callId);
    try {
      const endpoint = hasTranscript
        ? `/api/calls/${callId}/score`
        : `/api/calls/${callId}/retry-transcription`;

      const response = await fetch(endpoint, { method: 'POST' });

      if (response.ok) {
        // Remove from list and refresh
        setFailedCalls(prev => prev.filter(c => c.id !== callId));
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setRetrying(null);
    }
  };

  if (loading || dismissed || failedCalls.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-red-800">
              {failedCalls.length} call{failedCalls.length !== 1 ? 's' : ''} failed processing
            </h3>
            <p className="text-sm text-red-700 mt-1">
              These calls encountered errors and may need attention.
            </p>

            <div className="mt-3 space-y-2">
              {failedCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between bg-white border border-red-100 rounded p-2"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/calls/${call.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-primary truncate block"
                    >
                      {call.contact_name || 'Unknown Contact'}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {format(new Date(call.call_date), 'MMM d, h:mm a')}
                    </p>
                    {call.error_message && (
                      <p className="text-xs text-red-600 truncate mt-1" title={call.error_message}>
                        {call.error_message.slice(0, 60)}
                        {call.error_message.length > 60 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button
                      onClick={() => handleRetry(call.id, call.has_transcript)}
                      disabled={retrying === call.id}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      {retrying === call.id ? 'Retrying...' : 'Retry'}
                    </button>
                    <Link
                      href={`/calls/${call.id}`}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {failedCalls.length >= 5 && (
              <Link
                href="/calls?status=error"
                className="text-sm text-red-600 hover:text-red-800 font-medium mt-3 inline-block"
              >
                View all failed calls
              </Link>
            )}
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-red-400 hover:text-red-600 ml-4"
          title="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
