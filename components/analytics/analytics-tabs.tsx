'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports for heavy analytics components (recharts)
const OutcomeAnalytics = dynamic(() => import('./outcome-analytics').then(m => ({ default: m.OutcomeAnalytics })), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const ObjectionAnalytics = dynamic(() => import('./objection-analytics').then(m => ({ default: m.ObjectionAnalytics })), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const RepComparison = dynamic(() => import('./rep-comparison').then(m => ({ default: m.RepComparison })), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

type TabType = 'outcomes' | 'objections' | 'reps';

interface AnalyticsTabsProps {
  isManager?: boolean;
}

export function AnalyticsTabs({ isManager = false }: AnalyticsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('outcomes');

  const allTabs = [
    { id: 'outcomes' as const, label: 'Outcome Analytics', icon: ChartIcon, managerOnly: false },
    { id: 'objections' as const, label: 'Objection Patterns', icon: ShieldIcon, managerOnly: true },
    { id: 'reps' as const, label: 'Rep Comparison', icon: UsersIcon, managerOnly: true },
  ];

  // Filter tabs based on user role
  const tabs = allTabs.filter(tab => !tab.managerOnly || isManager);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'outcomes' && <OutcomeAnalytics />}
        {activeTab === 'objections' && <ObjectionAnalytics />}
        {activeTab === 'reps' && <RepComparison />}
      </div>
    </div>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
