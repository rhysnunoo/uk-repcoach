'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ObjectionDrill, DrillSetup, DrillResults } from '@/components/practice/objection-drill';
import type { Objection } from '@/lib/practice/objections';

type DrillState = 'setup' | 'active' | 'complete';

interface DrillResult {
  objection: Objection;
  response: string;
  responseTime: number;
  score: number | null;
  feedback: string | null;
}

export function DrillsContent() {
  const [drillState, setDrillState] = useState<DrillState>('setup');
  const [selectedObjections, setSelectedObjections] = useState<Objection[]>([]);
  const [results, setResults] = useState<DrillResult[]>([]);

  const handleStart = (objections: Objection[]) => {
    setSelectedObjections(objections);
    setResults([]);
    setDrillState('active');
  };

  const handleComplete = (drillResults: DrillResult[]) => {
    setResults(drillResults);
    setDrillState('complete');
  };

  const handleRestart = () => {
    setSelectedObjections([]);
    setResults([]);
    setDrillState('setup');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/practice"
            className="text-gray-500 hover:text-gray-700"
          >
            &larr; Back to Practice
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Objection Handling Drills</h1>
        <p className="text-gray-600 mt-1">
          Practice handling common objections with quick-fire drills. Get instant feedback and compare with expert responses.
        </p>
      </div>

      {/* Drill States */}
      {drillState === 'setup' && (
        <DrillSetup onStart={handleStart} />
      )}

      {drillState === 'active' && (
        <ObjectionDrill
          objections={selectedObjections}
          onComplete={handleComplete}
        />
      )}

      {drillState === 'complete' && (
        <DrillResults
          results={results}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
