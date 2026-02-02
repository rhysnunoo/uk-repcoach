'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TranscriptSegment } from '@/types/database';
import { formatDuration } from '@/lib/utils/format';

interface Bookmark {
  id: string;
  start_time: number;
  end_time: number;
  note: string;
  tag: string;
  created_at: string;
  created_by: string;
}

interface CallBookmarksProps {
  callId: string;
  transcript: TranscriptSegment[];
  isManager: boolean;
}

const BOOKMARK_TAGS = [
  { value: 'great_example', label: 'Great Example', color: 'bg-green-100 text-green-800' },
  { value: 'needs_coaching', label: 'Needs Coaching', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'objection_handling', label: 'Objection Handling', color: 'bg-blue-100 text-blue-800' },
  { value: 'closing_technique', label: 'Closing Technique', color: 'bg-purple-100 text-purple-800' },
  { value: 'pain_discovery', label: 'Pain Discovery', color: 'bg-orange-100 text-orange-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' },
];

export function CallBookmarks({ callId, transcript, isManager }: CallBookmarksProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('great_example');
  const [showForm, setShowForm] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    try {
      const response = await fetch(`/api/calls/${callId}/bookmarks`);
      if (response.ok) {
        const data = await response.json();
        setBookmarks(data.bookmarks || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
    } finally {
      setLoading(false);
    }
  }, [callId]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const createBookmark = async () => {
    if (!selection) return;

    setCreating(true);
    try {
      const response = await fetch(`/api/calls/${callId}/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_time: selection.start,
          end_time: selection.end,
          note: newNote,
          tag: newTag,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBookmarks(prev => [...prev, data.bookmark]);
        setShowForm(false);
        setSelection(null);
        setNewNote('');
        setNewTag('great_example');
      }
    } catch (error) {
      console.error('Failed to create bookmark:', error);
    } finally {
      setCreating(false);
    }
  };

  const deleteBookmark = async (bookmarkId: string) => {
    try {
      const response = await fetch(`/api/calls/${callId}/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
      }
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    }
  };

  const getTagStyle = (tag: string) => {
    return BOOKMARK_TAGS.find(t => t.value === tag)?.color || 'bg-gray-100 text-gray-800';
  };

  const getTagLabel = (tag: string) => {
    return BOOKMARK_TAGS.find(t => t.value === tag)?.label || tag;
  };

  const getTranscriptSlice = (startTime: number, endTime: number) => {
    return transcript
      .filter(seg => seg.start_time >= startTime && seg.end_time <= endTime)
      .map(seg => `${seg.speaker.toUpperCase()}: ${seg.text}`)
      .join('\n');
  };

  // Quick bookmark buttons for specific timestamps
  const handleQuickBookmark = (startTime: number) => {
    // Find the segment and set selection for 30 seconds around it
    const endTime = Math.min(startTime + 30, transcript[transcript.length - 1]?.end_time || startTime);
    setSelection({ start: startTime, end: endTime });
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">
          Bookmarks & Clips ({bookmarks.length})
        </h4>
        {!showForm && (
          <button
            onClick={() => {
              setSelection({ start: 0, end: 30 });
              setShowForm(true);
            }}
            className="text-sm text-primary hover:text-primary-600 font-medium"
          >
            + Add Bookmark
          </button>
        )}
      </div>

      {/* Create Bookmark Form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium text-gray-900">New Bookmark</h5>
            <button
              onClick={() => {
                setShowForm(false);
                setSelection(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Time</label>
              <select
                value={selection?.start || 0}
                onChange={(e) => setSelection(prev => ({ ...prev!, start: parseInt(e.target.value) }))}
                className="input"
              >
                {transcript.map((seg, idx) => (
                  <option key={idx} value={seg.start_time}>
                    {formatDuration(seg.start_time)} - {seg.speaker}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">End Time</label>
              <select
                value={selection?.end || 30}
                onChange={(e) => setSelection(prev => ({ ...prev!, end: parseInt(e.target.value) }))}
                className="input"
              >
                {transcript.filter(seg => seg.start_time >= (selection?.start || 0)).map((seg, idx) => (
                  <option key={idx} value={seg.end_time}>
                    {formatDuration(seg.end_time)} - {seg.speaker}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview */}
          {selection && (
            <div className="bg-white border border-gray-200 p-3 max-h-32 overflow-y-auto text-sm text-gray-700">
              <pre className="whitespace-pre-wrap font-sans">
                {getTranscriptSlice(selection.start, selection.end) || 'Select a time range to preview'}
              </pre>
            </div>
          )}

          {/* Tag Selection */}
          <div>
            <label className="label">Tag</label>
            <div className="flex flex-wrap gap-2">
              {BOOKMARK_TAGS.map((tag) => (
                <button
                  key={tag.value}
                  onClick={() => setNewTag(tag.value)}
                  className={`px-3 py-1 text-xs font-medium border ${
                    newTag === tag.value
                      ? `${tag.color} border-current`
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="label">Note (optional)</label>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add context about why this segment is noteworthy..."
              className="input min-h-[60px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setSelection(null);
              }}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              onClick={createBookmark}
              disabled={!selection || creating}
              className="btn-primary btn-sm"
            >
              {creating ? 'Saving...' : 'Save Bookmark'}
            </button>
          </div>
        </div>
      )}

      {/* Bookmarks List */}
      {loading ? (
        <div className="text-center py-4 text-gray-500 text-sm">Loading bookmarks...</div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          No bookmarks yet. Save key moments for training and review.
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.sort((a, b) => a.start_time - b.start_time).map((bookmark) => (
            <div
              key={bookmark.id}
              className="border border-gray-200 bg-white p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-500">
                      {formatDuration(bookmark.start_time)} - {formatDuration(bookmark.end_time)}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium ${getTagStyle(bookmark.tag)}`}>
                      {getTagLabel(bookmark.tag)}
                    </span>
                  </div>
                  {bookmark.note && (
                    <p className="text-sm text-gray-700 mb-2">{bookmark.note}</p>
                  )}
                  <details className="group">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                      Show transcript
                    </summary>
                    <div className="mt-2 bg-gray-50 p-2 text-xs text-gray-600 max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans">
                        {getTranscriptSlice(bookmark.start_time, bookmark.end_time)}
                      </pre>
                    </div>
                  </details>
                </div>
                {isManager && (
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="text-gray-400 hover:text-red-500 flex-shrink-0"
                    title="Delete bookmark"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Component to show bookmark indicators in the transcript viewer
export function BookmarkIndicator({
  bookmarks,
  currentTime,
  onJumpTo,
}: {
  bookmarks: Bookmark[];
  currentTime: number;
  onJumpTo: (time: number) => void;
}) {
  const relevantBookmarks = bookmarks.filter(
    b => currentTime >= b.start_time && currentTime <= b.end_time
  );

  if (relevantBookmarks.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {relevantBookmarks.map((b) => (
        <span
          key={b.id}
          className={`w-2 h-2 rounded-full ${
            BOOKMARK_TAGS.find(t => t.value === b.tag)?.color.split(' ')[0] || 'bg-gray-300'
          }`}
          title={b.note || BOOKMARK_TAGS.find(t => t.value === b.tag)?.label}
        />
      ))}
    </div>
  );
}
