'use client';

import { useState } from 'react';
import type { Score, ScoreQuote } from '@/types/database';
import { CLOSER_COACHING, getCoachingTip } from '@/lib/coaching/phrases';

interface FeedbackListProps {
  scores: Score[];
}

export function FeedbackList({ scores }: FeedbackListProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  if (scores.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">
        No feedback available
      </div>
    );
  }

  // Sort scores by CLOSER phase order + Price Presentation
  const phaseOrder = ['opening', 'clarify', 'label', 'overview', 'sell_vacation', 'price_presentation', 'explain', 'reinforce'];
  const sortedScores = [...scores].sort(
    (a, b) => phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase)
  );

  const togglePhase = (phase: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {sortedScores.map((score) => {
        const coaching = CLOSER_COACHING[score.phase];
        const isExpanded = expandedPhases.has(score.phase);
        const quotes = score.quotes as ScoreQuote[] || [];
        const negativeQuotes = quotes.filter(q => q.sentiment === 'negative');

        return (
          <div key={score.id} className="border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center justify-center w-8 h-8 font-bold text-white ${getScoreBgColor(score.score)}`}>
                  {coaching?.letter || score.phase.charAt(0).toUpperCase()}
                </span>
                <div>
                  <span className="font-medium text-gray-900">
                    {coaching?.displayName || (score.phase.charAt(0).toUpperCase() + score.phase.slice(1))}
                  </span>
                  <p className="text-xs text-gray-500">{coaching?.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xl font-bold ${getScoreColor(score.score)}`}>
                  {score.score.toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Coaching Tip */}
              <div className={`p-3 ${score.score < 60 ? 'bg-orange-50 border-l-4 border-orange-400' : 'bg-blue-50 border-l-4 border-blue-400'}`}>
                <p className="text-sm font-medium text-gray-800">
                  {getCoachingTip(score.phase, score.score)}
                </p>
              </div>

              {/* Feedback */}
              <div>
                <p className="text-sm text-gray-600">{score.feedback}</p>
              </div>

              {/* Side-by-side: You Said vs Script Says */}
              {(negativeQuotes.length > 0 || (score.improvements && score.improvements.length > 0)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* You Said */}
                  {negativeQuotes.length > 0 && (
                    <div className="bg-red-50 p-3 border border-red-200">
                      <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                        You Said
                      </h4>
                      <div className="space-y-2">
                        {negativeQuotes.slice(0, 2).map((quote, idx) => (
                          <p key={idx} className="text-sm text-red-700 italic">
                            &quot;{quote.text.length > 150 ? quote.text.slice(0, 150) + '...' : quote.text}&quot;
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Script Says */}
                  {coaching && coaching.recommendedPhrases.length > 0 && (
                    <div className="bg-green-50 p-3 border border-green-200">
                      <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                        Script Says
                      </h4>
                      <div className="space-y-2">
                        {coaching.recommendedPhrases.slice(0, 2).map((phrase, idx) => (
                          <p key={idx} className="text-sm text-green-700">
                            {phrase}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Highlights */}
              {score.highlights && score.highlights.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-700 mb-2">
                    What You Did Well
                  </h4>
                  <ul className="space-y-1">
                    {score.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span className="text-gray-700">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements with Script Examples */}
              {score.improvements && score.improvements.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-orange-700 mb-2">
                    Areas to Improve
                  </h4>
                  <ul className="space-y-1">
                    {score.improvements.map((improvement, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-orange-500 mt-0.5">→</span>
                        <span className="text-gray-700">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Expand to see full coaching */}
              {coaching && (
                <div>
                  <button
                    onClick={() => togglePhase(score.phase)}
                    className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"
                  >
                    {isExpanded ? '▼ Hide' : '▶ Show'} full coaching guide
                  </button>

                  {isExpanded && (
                    <div className="mt-3 space-y-4 p-4 bg-gray-50 border border-gray-200">
                      {/* Required Elements */}
                      <div>
                        <h5 className="text-sm font-semibold text-gray-800 mb-2">Required Elements</h5>
                        <ul className="space-y-1">
                          {coaching.requiredElements.map((element, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-gray-400">•</span>
                              {element}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* All Recommended Phrases */}
                      <div>
                        <h5 className="text-sm font-semibold text-gray-800 mb-2">Recommended Phrases</h5>
                        <div className="space-y-2">
                          {coaching.recommendedPhrases.map((phrase, idx) => (
                            <p key={idx} className="text-sm text-green-700 bg-green-50 p-2 border-l-2 border-green-400">
                              {phrase}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Avoid */}
                      <div>
                        <h5 className="text-sm font-semibold text-gray-800 mb-2">Avoid These</h5>
                        <ul className="space-y-1">
                          {coaching.avoidPhrases.map((phrase, idx) => (
                            <li key={idx} className="text-sm text-red-600 flex items-start gap-2">
                              <span>✕</span>
                              {phrase}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Example Script */}
                      <div>
                        <h5 className="text-sm font-semibold text-gray-800 mb-2">Example Script</h5>
                        <pre className="text-sm text-gray-700 bg-white p-3 border border-gray-200 whitespace-pre-wrap font-sans">
                          {coaching.exampleScript}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-600';
  if (score >= 60) return 'bg-yellow-600';
  return 'bg-red-600';
}
