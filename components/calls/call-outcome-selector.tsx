'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CallOutcomeSelectorProps {
  callId: string;
  currentOutcome: string | null;
}

const OUTCOMES = [
  { value: 'annual', label: 'Closed - Annual', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'monthly', label: 'Closed - Monthly', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'trial', label: 'Closed - Trial', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'callback', label: 'Callback Scheduled', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'not_interested', label: 'Not Interested', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'no_show', label: 'No Show', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { value: 'voicemail', label: 'Voicemail', color: 'bg-gray-100 text-gray-800 border-gray-200' },
];

export function CallOutcomeSelector({ callId, currentOutcome }: CallOutcomeSelectorProps) {
  const router = useRouter();
  const [outcome, setOutcome] = useState(currentOutcome || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOutcomeChange = async (newOutcome: string) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/calls/${callId}/outcome`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome: newOutcome }),
      });

      if (!response.ok) {
        throw new Error('Failed to update outcome');
      }

      setOutcome(newOutcome);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const selectedOutcome = OUTCOMES.find(o => o.value === outcome);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Call Outcome</label>

      {/* Current outcome display */}
      {selectedOutcome && (
        <div className={`inline-flex items-center px-3 py-1 text-sm font-medium border ${selectedOutcome.color}`}>
          {selectedOutcome.label}
        </div>
      )}

      {/* Outcome selector */}
      <select
        value={outcome}
        onChange={(e) => handleOutcomeChange(e.target.value)}
        disabled={saving}
        className="input text-sm"
      >
        <option value="">Select outcome...</option>
        {OUTCOMES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {saving && <p className="text-xs text-gray-500">Saving...</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function OutcomeBadge({ outcome }: { outcome: string | null }) {
  if (!outcome) return null;

  const outcomeConfig = OUTCOMES.find(o => o.value === outcome);
  if (!outcomeConfig) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
        {outcome}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium border ${outcomeConfig.color}`}>
      {outcomeConfig.label}
    </span>
  );
}

// Helper to check if outcome is a closed deal
export function isClosedDeal(outcome: string | null): boolean {
  return outcome === 'annual' || outcome === 'monthly' || outcome === 'trial';
}
