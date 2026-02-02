'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ScoreCallButtonProps {
  callId: string;
  status: string;
}

export function ScoreCallButton({ callId, status }: ScoreCallButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScore = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/calls/${callId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Scoring failed');
      }

      // Refresh the page to show new scores
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scoring failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleScore}
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? 'Scoring...' : status === 'scoring' ? 'Re-trigger Scoring' : 'Score This Call'}
      </button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
