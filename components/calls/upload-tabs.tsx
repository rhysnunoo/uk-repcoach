'use client';

import Link from 'next/link';

interface UploadTabsProps {
  currentMode: string;
}

export function UploadTabs({ currentMode }: UploadTabsProps) {
  const tabs = [
    { id: 'single', label: 'Single Upload', href: '/calls/upload' },
    { id: 'bulk', label: 'Bulk Upload', href: '/calls/upload?mode=bulk' },
    { id: 'ringover', label: 'Ringover Import', href: '/calls/upload?mode=ringover' },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          const isActive = currentMode === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
