'use client';

import { useState, useRef, useEffect, forwardRef } from 'react';
import type { TranscriptSegment } from '@/types/database';
import { formatDuration } from '@/lib/utils/format';
import { useAudioSeek } from './audio-player';

interface TranscriptViewerProps {
  transcript: TranscriptSegment[];
  currentAudioTime?: number;
  hasAudio?: boolean;
}

export function TranscriptViewer({ transcript, currentAudioTime, hasAudio }: TranscriptViewerProps) {
  const [filter, setFilter] = useState<'all' | 'rep' | 'prospect'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const { seekTo } = useAudioSeek();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // Find the current segment based on audio time
  const currentSegmentIndex = currentAudioTime !== undefined
    ? transcript.findIndex((seg, idx) => {
        const nextSeg = transcript[idx + 1];
        const segEnd = nextSeg ? nextSeg.start_time : (seg.end_time || seg.start_time + 30);
        return currentAudioTime >= seg.start_time && currentAudioTime < segEnd;
      })
    : -1;

  // Auto-scroll to the current segment
  useEffect(() => {
    if (autoScroll && activeSegmentRef.current && containerRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentSegmentIndex, autoScroll]);

  const filteredTranscript = transcript.filter((segment) => {
    const matchesFilter = filter === 'all' || segment.speaker === filter;
    const matchesSearch =
      !searchTerm ||
      segment.text.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSegmentClick = (startTime: number) => {
    if (hasAudio) {
      seekTo(startTime);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`btn-sm ${
              filter === 'all' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('rep')}
            className={`btn-sm ${
              filter === 'rep' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            Rep Only
          </button>
          <button
            onClick={() => setFilter('prospect')}
            className={`btn-sm ${
              filter === 'prospect' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            Prospect Only
          </button>
        </div>
        <input
          type="text"
          placeholder="Search transcript..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input flex-1"
        />
        {hasAudio && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-gray-300"
            />
            Auto-scroll
          </label>
        )}
      </div>

      {/* Transcript */}
      <div ref={containerRef} className="max-h-[600px] overflow-y-auto scrollbar-thin space-y-3">
        {filteredTranscript.length > 0 ? (
          filteredTranscript.map((segment, index) => {
            const originalIndex = transcript.indexOf(segment);
            const isActive = originalIndex === currentSegmentIndex;
            return (
              <TranscriptSegmentComponent
                key={index}
                ref={isActive ? activeSegmentRef : undefined}
                segment={segment}
                searchTerm={searchTerm}
                isActive={isActive}
                isClickable={hasAudio}
                onClick={() => handleSegmentClick(segment.start_time)}
              />
            );
          })
        ) : (
          <p className="text-gray-500 text-center py-8">
            {searchTerm
              ? 'No matching segments found'
              : 'No transcript segments available'}
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
        <span>
          {transcript.length} segment{transcript.length !== 1 ? 's' : ''} total
        </span>
        <span>
          Rep: {transcript.filter((s) => s.speaker === 'rep').length} |
          Prospect: {transcript.filter((s) => s.speaker === 'prospect').length}
        </span>
      </div>
    </div>
  );
}

interface TranscriptSegmentProps {
  segment: TranscriptSegment;
  searchTerm: string;
  isActive?: boolean;
  isClickable?: boolean;
  onClick?: () => void;
}

const TranscriptSegmentComponent = forwardRef<HTMLDivElement, TranscriptSegmentProps>(
  function TranscriptSegmentComponent({ segment, searchTerm, isActive, isClickable, onClick }, ref) {
    const isRep = segment.speaker === 'rep';

    // Highlight search term
    const highlightText = (text: string) => {
      if (!searchTerm) return text;

      const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
      const parts = text.split(regex);

      return parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      );
    };

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`flex gap-3 p-3 transition-all ${
          isRep ? 'bg-primary-50 border-l-4 border-primary' : 'bg-gray-50 border-l-4 border-gray-300'
        } ${isActive ? 'ring-2 ring-primary ring-offset-2' : ''} ${
          isClickable ? 'cursor-pointer hover:shadow-md' : ''
        }`}
      >
        <div className="flex-shrink-0">
          <span
            className={`inline-flex items-center justify-center w-8 h-8 text-xs font-bold ${
              isRep
                ? 'bg-primary text-white'
                : 'bg-gray-500 text-white'
            }`}
          >
            {isRep ? 'R' : 'P'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-gray-900">
              {isRep ? 'Sales Rep' : 'Prospect'}
            </span>
            <span className="text-xs text-gray-500">
              {formatDuration(segment.start_time)}
              {segment.end_time && ` - ${formatDuration(segment.end_time)}`}
            </span>
            {isClickable && (
              <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Click to play
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {highlightText(segment.text)}
          </p>
        </div>
      </div>
    );
  }
);

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
