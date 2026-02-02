// Server component - no interactivity needed

import { getScoreColor, getScoreBarColor } from '@/lib/utils/format';

interface PhaseScore {
  phase: string;
  label: string;
  score: number;
}

interface ScoreCardProps {
  scores: PhaseScore[];
}

export function ScoreCard({ scores }: ScoreCardProps) {
  // CLOSER framework phases + Price Presentation
  const phases = [
    { key: 'opening', label: 'Opening' },
    { key: 'clarify', label: 'Clarify' },
    { key: 'label', label: 'Label' },
    { key: 'overview', label: 'Overview (Pain Cycle)' },
    { key: 'sell_vacation', label: 'Sell the Vacation' },
    { key: 'price_presentation', label: 'Price Presentation' },
    { key: 'explain', label: 'Explain (AAA)' },
    { key: 'reinforce', label: 'Reinforce + Close' },
  ];

  const orderedScores = phases.map(({ key, label }) => {
    const found = scores.find((s) => s.phase === key);
    return found || { phase: key, label, score: 0 };
  });

  if (scores.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No scores available yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orderedScores.map((item) => (
        <div key={item.phase} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">
              {item.label}
            </span>
            <span className={`font-semibold ${getScoreColor(item.score)}`}>
              {item.score.toFixed(0)}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getScoreBarColor(item.score)}`}
              style={{ width: `${item.score}%` }}
            />
          </div>
        </div>
      ))}

      {/* Hormozi CLOSER Legend */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Opening - <span className="font-bold text-primary">C</span>larify -{' '}
          <span className="font-bold text-primary">L</span>abel -{' '}
          <span className="font-bold text-primary">O</span>verview -{' '}
          <span className="font-bold text-primary">S</span>ell Vacation -{' '}
          <span className="font-bold text-primary">E</span>xplain -{' '}
          <span className="font-bold text-primary">R</span>einforce
        </p>
      </div>
    </div>
  );
}

