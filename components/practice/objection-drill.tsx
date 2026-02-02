'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  type Objection,
  getRandomObjections,
  categoryLabels,
  difficultyLabels,
} from '@/lib/practice/objections';

interface ObjectionDrillProps {
  objections: Objection[];
  onComplete: (results: DrillResult[]) => void;
}

interface DrillResult {
  objection: Objection;
  response: string;
  responseTime: number; // seconds
  score: number | null;
  feedback: string | null;
}

export function ObjectionDrill({ objections, onComplete }: ObjectionDrillProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [results, setResults] = useState<DrillResult[]>([]);
  const [isScoring, setIsScoring] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentResult, setCurrentResult] = useState<DrillResult | null>(null);

  const currentObjection = objections[currentIndex];
  const isComplete = currentIndex >= objections.length;

  // Start timer when objection appears
  useEffect(() => {
    if (!isComplete && !showFeedback) {
      setStartTime(Date.now());
    }
  }, [currentIndex, isComplete, showFeedback]);

  const submitResponse = useCallback(async () => {
    if (!response.trim() || isScoring || !startTime) return;

    const responseTime = Math.round((Date.now() - startTime) / 1000);
    setIsScoring(true);

    try {
      // Score the response via API
      const res = await fetch('/api/practice/objection-drill/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectionId: currentObjection.id,
          response: response.trim(),
        }),
      });

      const data = await res.json();

      const result: DrillResult = {
        objection: currentObjection,
        response: response.trim(),
        responseTime,
        score: data.score ?? null,
        feedback: data.feedback ?? null,
      };

      setCurrentResult(result);
      setResults(prev => [...prev, result]);
      setShowFeedback(true);
    } catch (error) {
      console.error('Error scoring response:', error);
      // Continue without score
      const result: DrillResult = {
        objection: currentObjection,
        response: response.trim(),
        responseTime,
        score: null,
        feedback: 'Unable to score response',
      };
      setCurrentResult(result);
      setResults(prev => [...prev, result]);
      setShowFeedback(true);
    } finally {
      setIsScoring(false);
    }
  }, [response, isScoring, startTime, currentObjection]);

  const nextObjection = () => {
    setResponse('');
    setShowFeedback(false);
    setCurrentResult(null);
    if (currentIndex + 1 >= objections.length) {
      onComplete(results);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      if (showFeedback) {
        nextObjection();
      } else {
        submitResponse();
      }
    }
  };

  if (isComplete) {
    return null; // Parent handles completion
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Objection {currentIndex + 1} of {objections.length}
          </span>
          <div className="flex items-center gap-2">
            <span className={`badge ${
              currentObjection.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              currentObjection.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {difficultyLabels[currentObjection.difficulty]}
            </span>
            <span className="badge bg-gray-100 text-gray-800">
              {categoryLabels[currentObjection.category]}
            </span>
          </div>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((currentIndex) / objections.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Objection Card */}
      <div className="card mb-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-sm font-medium text-red-800 mb-1">Prospect says:</p>
          <p className="text-lg text-red-900 font-medium">
            &quot;{currentObjection.objection}&quot;
          </p>
        </div>

        {!showFeedback ? (
          <>
            <label className="label">Your Response</label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response to handle this objection..."
              className="input min-h-[120px] mb-4"
              autoFocus
              disabled={isScoring}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Press Ctrl+Enter to submit
              </p>
              <button
                onClick={submitResponse}
                disabled={!response.trim() || isScoring}
                className="btn-primary"
              >
                {isScoring ? 'Scoring...' : 'Submit Response'}
              </button>
            </div>
          </>
        ) : currentResult && (
          <div className="space-y-4">
            {/* Score */}
            {currentResult.score !== null && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-medium">Your Score</span>
                <span className={`text-2xl font-bold ${
                  currentResult.score >= 80 ? 'text-green-600' :
                  currentResult.score >= 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {currentResult.score}%
                </span>
              </div>
            )}

            {/* Your Response */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-medium text-blue-800 mb-1">Your Response:</p>
              <p className="text-blue-900">{currentResult.response}</p>
              <p className="text-xs text-blue-600 mt-1">
                Response time: {currentResult.responseTime}s
              </p>
            </div>

            {/* Feedback */}
            {currentResult.feedback && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                <p className="text-sm font-medium text-amber-800 mb-1">Feedback:</p>
                <p className="text-amber-900">{currentResult.feedback}</p>
              </div>
            )}

            {/* Sample Response */}
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm font-medium text-green-800 mb-1">
                Sample Response:
              </p>
              <p className="text-green-900">{currentObjection.sampleResponse}</p>
            </div>

            {/* Tips */}
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm font-medium text-gray-700 mb-2">Tips:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {currentObjection.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={nextObjection}
              className="btn-primary w-full"
            >
              {currentIndex + 1 >= objections.length ? 'View Results' : 'Next Objection →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Drill Setup Component
interface DrillSetupProps {
  onStart: (objections: Objection[]) => void;
}

export function DrillSetup({ onStart }: DrillSetupProps) {
  const [count, setCount] = useState(5);
  const [categories, setCategories] = useState<Objection['category'][]>([]);
  const [difficulties, setDifficulties] = useState<Objection['difficulty'][]>([]);

  const allCategories: Objection['category'][] = ['price', 'timing', 'trust', 'competition', 'need', 'authority'];
  const allDifficulties: Objection['difficulty'][] = ['easy', 'medium', 'hard'];

  const toggleCategory = (cat: Objection['category']) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleDifficulty = (diff: Objection['difficulty']) => {
    setDifficulties(prev =>
      prev.includes(diff) ? prev.filter(d => d !== diff) : [...prev, diff]
    );
  };

  const startDrill = () => {
    const selectedObjections = getRandomObjections(count, {
      categories: categories.length > 0 ? categories : undefined,
      difficulties: difficulties.length > 0 ? difficulties : undefined,
    });
    onStart(selectedObjections);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h2 className="card-header">Configure Your Drill</h2>

        {/* Number of Objections */}
        <div className="mb-6">
          <label className="label">Number of Objections</label>
          <div className="flex gap-2">
            {[3, 5, 7, 10].map(n => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`px-4 py-2 rounded border ${
                  count === n
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <label className="label">Categories (leave empty for all)</label>
          <div className="flex flex-wrap gap-2">
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  categories.includes(cat)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="mb-6">
          <label className="label">Difficulty (leave empty for all)</label>
          <div className="flex flex-wrap gap-2">
            {allDifficulties.map(diff => (
              <button
                key={diff}
                onClick={() => toggleDifficulty(diff)}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  difficulties.includes(diff)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                }`}
              >
                {difficultyLabels[diff]}
              </button>
            ))}
          </div>
        </div>

        <button onClick={startDrill} className="btn-primary w-full">
          Start Drill
        </button>
      </div>
    </div>
  );
}

// Drill Results Component
interface DrillResultsProps {
  results: DrillResult[];
  onRestart: () => void;
}

export function DrillResults({ results, onRestart }: DrillResultsProps) {
  const router = useRouter();

  const avgScore = results.filter(r => r.score !== null).length > 0
    ? Math.round(
        results.filter(r => r.score !== null).reduce((sum, r) => sum + (r.score || 0), 0) /
        results.filter(r => r.score !== null).length
      )
    : null;

  const avgTime = Math.round(
    results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
  );

  const categoryStats = results.reduce((acc, r) => {
    const cat = r.objection.category;
    if (!acc[cat]) acc[cat] = { count: 0, totalScore: 0, scored: 0 };
    acc[cat].count++;
    if (r.score !== null) {
      acc[cat].totalScore += r.score;
      acc[cat].scored++;
    }
    return acc;
  }, {} as Record<string, { count: number; totalScore: number; scored: number }>);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card mb-6">
        <h2 className="card-header">Drill Complete!</h2>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded">
            <p className="text-3xl font-bold text-primary">{results.length}</p>
            <p className="text-sm text-gray-600">Objections</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <p className={`text-3xl font-bold ${
              avgScore !== null && avgScore >= 70 ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {avgScore !== null ? `${avgScore}%` : '-'}
            </p>
            <p className="text-sm text-gray-600">Avg Score</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <p className="text-3xl font-bold text-blue-600">{avgTime}s</p>
            <p className="text-sm text-gray-600">Avg Response Time</p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Performance by Category</h3>
          <div className="space-y-2">
            {Object.entries(categoryStats).map(([cat, stats]) => (
              <div key={cat} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">
                  {categoryLabels[cat as Objection['category']]}
                </span>
                <span className={`font-bold ${
                  stats.scored > 0 && stats.totalScore / stats.scored >= 70
                    ? 'text-green-600'
                    : 'text-yellow-600'
                }`}>
                  {stats.scored > 0 ? `${Math.round(stats.totalScore / stats.scored)}%` : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onRestart} className="btn-primary flex-1">
            Practice Again
          </button>
          <button
            onClick={() => router.push('/practice')}
            className="btn-secondary flex-1"
          >
            Back to Practice
          </button>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="card">
        <h3 className="card-header">Detailed Results</h3>
        <div className="space-y-4">
          {results.map((result, idx) => (
            <details key={idx} className="border border-gray-200 rounded">
              <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">#{idx + 1}</span>
                  <span className="font-medium text-gray-900 truncate max-w-md">
                    {result.objection.objection.slice(0, 60)}...
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{result.responseTime}s</span>
                  {result.score !== null && (
                    <span className={`font-bold ${
                      result.score >= 70 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {result.score}%
                    </span>
                  )}
                </div>
              </summary>
              <div className="p-4 pt-0 space-y-3 text-sm">
                <div className="p-2 bg-red-50 rounded">
                  <p className="font-medium text-red-800">Objection:</p>
                  <p className="text-red-900">&quot;{result.objection.objection}&quot;</p>
                </div>
                <div className="p-2 bg-blue-50 rounded">
                  <p className="font-medium text-blue-800">Your Response:</p>
                  <p className="text-blue-900">{result.response}</p>
                </div>
                {result.feedback && (
                  <div className="p-2 bg-amber-50 rounded">
                    <p className="font-medium text-amber-800">Feedback:</p>
                    <p className="text-amber-900">{result.feedback}</p>
                  </div>
                )}
                <div className="p-2 bg-green-50 rounded">
                  <p className="font-medium text-green-800">Sample Response:</p>
                  <p className="text-green-900">{result.objection.sampleResponse}</p>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
