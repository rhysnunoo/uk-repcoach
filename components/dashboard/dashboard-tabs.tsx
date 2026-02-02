'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface DashboardTabsProps {
  currentView: 'team' | 'personal';
}

export function DashboardTabs({ currentView }: DashboardTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const switchView = (view: 'team' | 'personal') => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === 'team') {
      params.delete('view');
    } else {
      params.set('view', 'personal');
    }
    router.push(`/dashboard${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="flex rounded-lg bg-gray-100 p-1">
      <button
        onClick={() => switchView('team')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          currentView === 'team'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <span className="flex items-center gap-2">
          <UsersIcon className="w-4 h-4" />
          Team
        </span>
      </button>
      <button
        onClick={() => switchView('personal')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          currentView === 'personal'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <span className="flex items-center gap-2">
          <UserIcon className="w-4 h-4" />
          My Stats
        </span>
      </button>
    </div>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
