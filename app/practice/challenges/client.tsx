'use client';

import { useState } from 'react';
import { ChallengeList, CreateChallengeForm } from '@/components/practice/challenges';

interface ChallengeListClientProps {
  isManager: boolean;
}

export function ChallengeListClient({ isManager }: ChallengeListClientProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      {isManager && (
        <div className="mb-6">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              + Create Challenge
            </button>
          ) : (
            <div className="card">
              <h2 className="card-header">Create New Challenge</h2>
              <CreateChallengeForm
                onSuccess={() => {
                  setShowCreateForm(false);
                  setRefreshKey(k => k + 1);
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          )}
        </div>
      )}

      <div key={refreshKey}>
        <ChallengeList />
      </div>
    </>
  );
}
