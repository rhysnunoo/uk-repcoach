'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CallContext } from '@/types/database';

const CONTEXT_LABELS: Record<CallContext, string> = {
  new_lead: 'New Lead',
  booked_call: 'Booked Call',
  warm_lead: 'Warm Lead',
  follow_up: 'Follow-Up',
};

const CONTEXT_DESCRIPTIONS: Record<CallContext, string> = {
  new_lead: 'First ever interaction — full CLOSER scoring',
  booked_call: 'They booked a call — relaxed discovery criteria',
  warm_lead: 'Already been messaging — discovery phases excluded',
  follow_up: 'Returning from a previous call — discovery phases excluded',
};

interface CallContextSelectorProps {
  callId: string;
  currentContext: CallContext;
  canEdit: boolean;
}

export function CallContextSelector({ callId, currentContext, canEdit }: CallContextSelectorProps) {
  const router = useRouter();
  const [context, setContext] = useState<CallContext>(currentContext);
  const [saving, setSaving] = useState(false);

  const handleChange = async (newContext: CallContext) => {
    if (newContext === context) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/calls/${callId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_context: newContext }),
      });

      if (response.ok) {
        setContext(newContext);
        // Refresh the page to show updated scores after re-scoring
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update call context');
      }
    } catch {
      alert('Failed to update call context');
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) {
    return (
      <div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
          {CONTEXT_LABELS[context]}
        </span>
        <p className="text-xs text-gray-500 mt-1">{CONTEXT_DESCRIPTIONS[context]}</p>
      </div>
    );
  }

  return (
    <div>
      <select
        value={context}
        onChange={(e) => handleChange(e.target.value as CallContext)}
        disabled={saving}
        className="input text-sm py-1"
      >
        {(Object.keys(CONTEXT_LABELS) as CallContext[]).map((ctx) => (
          <option key={ctx} value={ctx}>
            {CONTEXT_LABELS[ctx]}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-1">
        {saving ? 'Saving & re-scoring...' : CONTEXT_DESCRIPTIONS[context]}
      </p>
    </div>
  );
}

export function CallContextBadge({ context }: { context: CallContext }) {
  const colors: Record<CallContext, string> = {
    new_lead: 'bg-blue-100 text-blue-700',
    booked_call: 'bg-green-100 text-green-700',
    warm_lead: 'bg-amber-100 text-amber-700',
    follow_up: 'bg-purple-100 text-purple-700',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${colors[context]}`}>
      {CONTEXT_LABELS[context]}
    </span>
  );
}
