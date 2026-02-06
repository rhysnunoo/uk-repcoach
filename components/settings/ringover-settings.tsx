'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Profile, RingoverSyncLog } from '@/types/database';

interface RingoverUser {
  user_id: number;
  email: string;
  firstname: string;
  lastname: string;
  concat_name: string;
}

interface RingoverSettingsProps {
  syncLogs: RingoverSyncLog[];
}

export function RingoverSettings({ syncLogs }: RingoverSettingsProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [users, setUsers] = useState<RingoverUser[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingMappings, setSavingMappings] = useState(false);
  const [minDuration, setMinDuration] = useState(60); // Default 60 seconds
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  const runSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/ringover/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minDuration }),
      });

      const data = await response.json();

      if (response.ok) {
        let message = `Synced ${data.synced} calls`;
        if (data.transcribing > 0) {
          message += ` (${data.transcribing} queued for transcription)`;
        }
        message += ` - ${data.skipped} skipped, ${data.failed} failed`;
        setSyncResult({
          success: true,
          message,
        });
      } else {
        setSyncResult({
          success: false,
          message: data.error || 'Sync failed',
        });
      }
    } catch {
      setSyncResult({
        success: false,
        message: 'Network error',
      });
    } finally {
      setSyncing(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/ringover/users');
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
        setProfiles(data.profiles || []);
        setConnectionStatus(data.users?.length >= 0 && !data.error ? 'connected' : 'disconnected');

        // Build initial mappings
        const initialMappings: Record<string, string> = {};
        (data.profiles || []).forEach((p: Profile & { ringover_user_id?: string }) => {
          if (p.ringover_user_id) {
            initialMappings[p.id] = p.ringover_user_id;
          }
        });
        setMappings(initialMappings);
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      setConnectionStatus('disconnected');
    } finally {
      setLoadingUsers(false);
    }
  };

  const saveMappings = async () => {
    setSavingMappings(true);
    try {
      const mappingsArray = Object.entries(mappings).map(([profileId, ringoverUserId]) => ({
        profileId,
        ringoverUserId: ringoverUserId || null,
      }));

      const response = await fetch('/api/ringover/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mappings: mappingsArray }),
      });

      if (response.ok) {
        alert('Mappings saved successfully');
      }
    } catch (error) {
      console.error('Failed to save mappings:', error);
      alert('Failed to save mappings');
    } finally {
      setSavingMappings(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="card">
        <h3 className="card-header">Ringover Integration</h3>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-600">Connection Status:</span>
          {connectionStatus === 'checking' && (
            <span className="badge bg-gray-100 text-gray-800">Checking...</span>
          )}
          {connectionStatus === 'connected' && (
            <span className="badge bg-green-100 text-green-800">Connected</span>
          )}
          {connectionStatus === 'disconnected' && (
            <span className="badge bg-red-100 text-red-800">Disconnected</span>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Sync completed calls from Ringover. Calls with recordings will be automatically
          transcribed and scored against the CLOSER framework. If you have Ringover Empower
          enabled, transcripts will be imported directly.
        </p>

        {connectionStatus === 'disconnected' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <p className="text-sm text-yellow-800">
              Unable to connect to Ringover. Please check that <code className="bg-yellow-100 px-1">RINGOVER_API_KEY</code>{' '}
              is configured in your environment variables.
            </p>
          </div>
        )}
      </div>

      {/* Webhook Setup */}
      <div className="card bg-green-50">
        <h3 className="card-header">Automatic Webhook Sync (Recommended)</h3>
        <p className="text-sm text-gray-600 mb-4">
          For real-time call syncing, set up a webhook in your Ringover dashboard. Calls will be
          automatically transcribed using OpenAI Whisper (~$0.06 per 10-minute call).
        </p>

        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-2">
            <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <p className="text-sm text-gray-700">Go to Ringover Dashboard → Settings → Webhooks</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <p className="text-sm text-gray-700">Click &quot;Add Webhook&quot;</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <div className="text-sm text-gray-700">
              <p>Enter this URL:</p>
              <code className="block mt-1 p-2 bg-green-100 rounded text-xs break-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/ringover` : '/api/webhooks/ringover'}
              </code>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">4</span>
            <p className="text-sm text-gray-700">Select event: <strong>call.ended</strong></p>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">5</span>
            <p className="text-sm text-gray-700">Save the webhook</p>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Once configured, calls ending in Ringover will automatically appear in RepCoach within a few minutes.
        </p>
      </div>

      {/* Sync Section */}
      <div className="card">
        <h3 className="card-header">Ringover Call Sync</h3>

        <div className="space-y-4 mb-6">
          {/* Minimum Duration Setting */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label htmlFor="ringoverMinDuration" className="block text-sm font-medium text-gray-700">
                Minimum Call Duration
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Only sync calls longer than this duration (filters out quick or failed calls)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="ringoverMinDuration"
                value={minDuration}
                onChange={(e) => setMinDuration(Math.max(0, parseInt(e.target.value) || 0))}
                className="input w-24"
                min={0}
                step={10}
              />
              <span className="text-sm text-gray-600">seconds</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={runSync}
              disabled={syncing || connectionStatus === 'disconnected'}
              className="btn-primary"
            >
              {syncing ? 'Syncing...' : 'Run Manual Sync'}
            </button>
          </div>
        </div>

        {syncResult && (
          <div
            className={`p-4 mb-6 rounded-lg ${
              syncResult.success
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {syncResult.message}
          </div>
        )}

        {/* Sync History */}
        <h4 className="font-medium text-gray-900 mb-2">Sync History</h4>
        {syncLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Synced</th>
                  <th>Failed</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {syncLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{format(new Date(log.started_at), 'MMM d, h:mm a')}</td>
                    <td>
                      <span className={`badge ${
                        log.sync_type === 'cron'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {log.sync_type}
                      </span>
                    </td>
                    <td>{log.calls_synced}</td>
                    <td>{log.calls_failed}</td>
                    <td>
                      {log.error_message ? (
                        <span className="badge bg-red-100 text-red-800">Error</span>
                      ) : log.ended_at ? (
                        <span className="badge bg-green-100 text-green-800">Complete</span>
                      ) : (
                        <span className="badge bg-yellow-100 text-yellow-800">Running</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No sync history yet</p>
        )}
      </div>

      {/* User Mapping Section */}
      <div className="card">
        <h3 className="card-header">User Mapping</h3>
        <p className="text-sm text-gray-600 mb-4">
          Map Ringover users to RepCoach users to correctly attribute synced calls.
        </p>

        {loadingUsers ? (
          <p className="text-gray-500">Loading...</p>
        ) : users.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>RepCoach User</th>
                    <th>Ringover User</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => (
                    <tr key={profile.id}>
                      <td>
                        <div>
                          <p className="font-medium">{profile.full_name || profile.email}</p>
                          <p className="text-sm text-gray-500">{profile.email}</p>
                        </div>
                      </td>
                      <td>
                        <select
                          value={mappings[profile.id] || ''}
                          onChange={(e) =>
                            setMappings((prev) => ({
                              ...prev,
                              [profile.id]: e.target.value,
                            }))
                          }
                          className="input"
                        >
                          <option value="">-- Not Mapped --</option>
                          {users.map((user) => (
                            <option key={user.user_id} value={String(user.user_id)}>
                              {user.concat_name || `${user.firstname} ${user.lastname}`} ({user.email})
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={saveMappings}
              disabled={savingMappings}
              className="btn-primary"
            >
              {savingMappings ? 'Saving...' : 'Save Mappings'}
            </button>
          </div>
        ) : connectionStatus === 'connected' ? (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-2">
              No Ringover users found.
            </p>
            <button onClick={loadUsers} className="btn-secondary btn-sm">
              Retry
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-2">
              Unable to fetch Ringover users. Check your API configuration.
            </p>
            <button onClick={loadUsers} className="btn-secondary btn-sm">
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Cron Configuration Info */}
      <div className="card bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-2">Automatic Sync</h4>
        <p className="text-sm text-gray-600 mb-4">
          Configure automatic syncing by setting up a Vercel cron job. Add the following
          to your <code className="bg-gray-200 px-1">vercel.json</code>:
        </p>
        <pre className="bg-gray-900 text-gray-100 p-4 text-sm overflow-x-auto">
{`{
  "crons": [
    {
      "path": "/api/cron/ringover-sync",
      "schedule": "*/15 * * * *"
    }
  ]
}`}
        </pre>
        <p className="text-xs text-gray-500 mt-2">
          This will sync calls every 15 minutes. Make sure to set <code>CRON_SECRET</code> environment variable.
        </p>
      </div>

      {/* Environment Variables Info */}
      <div className="card bg-blue-50">
        <h4 className="font-medium text-gray-900 mb-2">Required Environment Variables</h4>
        <p className="text-sm text-gray-600 mb-4">
          Add the following to your <code className="bg-blue-100 px-1">.env.local</code> file:
        </p>
        <pre className="bg-gray-900 text-gray-100 p-4 text-sm overflow-x-auto">
{`RINGOVER_API_KEY=<your_api_key>`}
        </pre>
        <p className="text-xs text-gray-500 mt-2">
          You can find your API key in the Ringover Dashboard under Settings &gt; API.
        </p>
      </div>
    </div>
  );
}
