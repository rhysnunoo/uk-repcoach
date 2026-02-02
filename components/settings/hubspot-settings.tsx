'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { HubspotSyncLog, Profile } from '@/types/database';

interface HubspotOwner {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface HubspotSettingsProps {
  syncLogs: HubspotSyncLog[];
}

export function HubspotSettings({ syncLogs }: HubspotSettingsProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [owners, setOwners] = useState<HubspotOwner[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [savingMappings, setSavingMappings] = useState(false);
  const [minDuration, setMinDuration] = useState(60); // Default 60 seconds

  const runSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/hubspot/sync', {
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

  const loadOwners = async () => {
    setLoadingOwners(true);
    try {
      const response = await fetch('/api/hubspot/owners');
      const data = await response.json();

      if (response.ok) {
        setOwners(data.owners || []);
        setProfiles(data.profiles || []);

        // Build initial mappings
        const initialMappings: Record<string, string> = {};
        (data.profiles || []).forEach((p: Profile) => {
          if (p.hubspot_owner_id) {
            initialMappings[p.id] = p.hubspot_owner_id;
          }
        });
        setMappings(initialMappings);
      }
    } catch (error) {
      console.error('Failed to load owners:', error);
    } finally {
      setLoadingOwners(false);
    }
  };

  const saveMappings = async () => {
    setSavingMappings(true);
    try {
      const mappingsArray = Object.entries(mappings).map(([profileId, hubspotOwnerId]) => ({
        profileId,
        hubspotOwnerId: hubspotOwnerId || null,
      }));

      const response = await fetch('/api/hubspot/owners', {
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
    loadOwners();
  }, []);

  return (
    <div className="space-y-6">
      {/* Sync Section */}
      <div className="card">
        <h3 className="card-header">HubSpot Call Sync</h3>

        <div className="space-y-4 mb-6">
          <p className="text-sm text-gray-600">
            Sync completed calls from HubSpot. Calls with recordings will be automatically
            transcribed and scored against the CLOSER framework.
          </p>

          {/* Minimum Duration Setting */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label htmlFor="minDuration" className="block text-sm font-medium text-gray-700">
                Minimum Call Duration
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Only sync calls longer than this duration (filters out quick or failed calls)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="minDuration"
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
              disabled={syncing}
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

      {/* Owner Mapping Section */}
      <div className="card">
        <h3 className="card-header">Owner Mapping</h3>
        <p className="text-sm text-gray-600 mb-4">
          Map HubSpot owners to RepCoach users to correctly attribute synced calls.
        </p>

        {loadingOwners ? (
          <p className="text-gray-500">Loading...</p>
        ) : owners.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>RepCoach User</th>
                    <th>HubSpot Owner</th>
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
                          {owners.map((owner) => (
                            <option key={owner.id} value={owner.id}>
                              {owner.firstName} {owner.lastName} ({owner.email})
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
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-2">
              Unable to fetch HubSpot owners. Check your API configuration.
            </p>
            <button onClick={loadOwners} className="btn-secondary btn-sm">
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
      "path": "/api/cron/hubspot-sync",
      "schedule": "*/15 * * * *"
    }
  ]
}`}
        </pre>
        <p className="text-xs text-gray-500 mt-2">
          This will sync calls every 15 minutes. Make sure to set <code>CRON_SECRET</code> environment variable.
        </p>
      </div>
    </div>
  );
}
