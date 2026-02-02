'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SpeakerCorrectionProps {
  callId: string;
  transcript: { speaker: string; text: string; start_time: number; end_time: number }[];
}

export function SpeakerCorrection({ callId, transcript }: SpeakerCorrectionProps) {
  const router = useRouter();
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if speakers might be swapped by looking at first few segments
  const firstRepSegment = transcript.find(s => s.speaker === 'rep');
  const mightBeSwapped = firstRepSegment && (
    /\b(my (son|daughter|child)|i('m| am) interested|i booked)\b/i.test(firstRepSegment.text) ||
    !/\b(this is|calling from|myedspace|thanks for)\b/i.test(firstRepSegment.text.toLowerCase())
  );

  const handleSwapSpeakers = async () => {
    setSwapping(true);
    setError(null);

    try {
      const response = await fetch(`/api/calls/${callId}/swap-speakers`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to swap speakers');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to swap speakers');
    } finally {
      setSwapping(false);
    }
  };

  return (
    <div className={`p-3 border ${mightBeSwapped ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">
            {mightBeSwapped ? (
              <>
                <span className="text-yellow-600">⚠️ Speakers may be swapped</span>
                <span className="text-gray-500 ml-2">- Check if Rep/Prospect labels are correct</span>
              </>
            ) : (
              'Speaker labels look correct'
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Rep segments: {transcript.filter(s => s.speaker === 'rep').length} |
            Prospect segments: {transcript.filter(s => s.speaker === 'prospect').length}
          </p>
        </div>
        <button
          onClick={handleSwapSpeakers}
          disabled={swapping}
          className="btn-secondary btn-sm"
        >
          {swapping ? 'Swapping...' : 'Swap Speakers'}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
