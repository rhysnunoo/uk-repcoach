'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Rep {
  id: string;
  full_name: string | null;
  email: string;
}

interface CallRepSelectorProps {
  callId: string;
  currentRepId: string | null;
  reps: Rep[];
}

export function CallRepSelector({ callId, currentRepId, reps }: CallRepSelectorProps) {
  const router = useRouter();
  const [selectedRep, setSelectedRep] = useState(currentRepId || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleRepChange = async (newRepId: string) => {
    if (newRepId === currentRepId) {
      setSelectedRep(newRepId);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/calls/${callId}/reassign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rep_id: newRepId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reassign call');
      }

      setSelectedRep(newRepId);
      setSuccess(true);
      router.refresh();

      // Clear success message after 3 seconds
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reassign');
      setSelectedRep(currentRepId || ''); // Revert on error
    } finally {
      setSaving(false);
    }
  };

  const currentRepName = reps.find(r => r.id === selectedRep)?.full_name || 'Unknown';

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Assigned Rep</label>

      <select
        value={selectedRep}
        onChange={(e) => handleRepChange(e.target.value)}
        disabled={saving}
        className="input text-sm w-full"
      >
        {reps.map((rep) => (
          <option key={rep.id} value={rep.id}>
            {rep.full_name || rep.email}
          </option>
        ))}
      </select>

      {saving && <p className="text-xs text-gray-500">Reassigning call...</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && <p className="text-xs text-green-600">Call reassigned successfully</p>}
    </div>
  );
}
