'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Rep {
  id: string;
  full_name: string | null;
  email: string;
}

export function RingoverUploader() {
  const router = useRouter();
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [contactName, setContactName] = useState('');
  const [callDate, setCallDate] = useState('');
  const [selectedRepId, setSelectedRepId] = useState<string>('');
  const [reps, setReps] = useState<Rep[]>([]);
  const [loadingReps, setLoadingReps] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateCallId, setDuplicateCallId] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ callId: string; repName: string; segmentCount: number } | null>(null);

  const transcriptInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Fetch list of reps on mount
  useEffect(() => {
    async function fetchReps() {
      try {
        const response = await fetch('/api/profiles');
        if (response.ok) {
          const data = await response.json();
          setReps(data.profiles || []);
        }
      } catch (err) {
        console.error('Failed to fetch reps:', err);
      } finally {
        setLoadingReps(false);
      }
    }
    fetchReps();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transcriptFile) {
      setError('Please select a transcript file (.txt)');
      return;
    }

    setUploading(true);
    setError(null);
    setDuplicateCallId(null);

    try {
      const formData = new FormData();
      formData.append('transcript', transcriptFile);
      if (audioFile) {
        formData.append('audio', audioFile);
      }
      if (contactName) {
        formData.append('contactName', contactName);
      }
      if (callDate) {
        formData.append('callDate', new Date(callDate).toISOString());
      }
      if (selectedRepId) {
        formData.append('repId', selectedRepId);
      }

      const response = await fetch('/api/calls/upload-ringover', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.isDuplicate && data.existingCallId) {
          setDuplicateCallId(data.existingCallId);
          setError(data.error);
          return;
        }
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess({
        callId: data.callId,
        repName: data.repName,
        segmentCount: data.segmentCount,
      });

      // Clear form
      setTranscriptFile(null);
      setAudioFile(null);
      setContactName('');
      setCallDate('');
      setSelectedRepId('');
      if (transcriptInputRef.current) transcriptInputRef.current.value = '';
      if (audioInputRef.current) audioInputRef.current.value = '';

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How to export from Ringover</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Go to your Ringover call log</li>
          <li>Click on the call you want to import</li>
          <li>Download the transcript (.txt file)</li>
          <li>Optionally download the recording (.mp3 file)</li>
          <li>Upload both files below</li>
        </ol>
        <p className="text-xs text-blue-600 mt-2">
          This method is free and doesn't require the Empower module.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 p-4">
          <h3 className="font-semibold text-green-900">Upload Successful!</h3>
          <p className="text-sm text-green-700 mt-1">
            Imported {success.segmentCount} transcript segments from {success.repName || 'call'}.
          </p>
          <p className="text-sm text-green-700">
            Scoring is in progress...
          </p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => router.push(`/calls/${success.callId}`)}
              className="btn-primary btn-sm"
            >
              View Call
            </button>
            <button
              onClick={() => setSuccess(null)}
              className="btn-secondary btn-sm"
            >
              Upload Another
            </button>
          </div>
        </div>
      )}

      {/* Upload Form */}
      {!success && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transcript File (Required) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transcript File (.txt) <span className="text-red-500">*</span>
            </label>
            <input
              ref={transcriptInputRef}
              type="file"
              accept=".txt"
              onChange={(e) => setTranscriptFile(e.target.files?.[0] || null)}
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              The exported transcript file from Ringover (log_call_export_*.txt)
            </p>
          </div>

          {/* Audio File (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audio Recording (.mp3) <span className="text-gray-400">(optional)</span>
            </label>
            <input
              ref={audioInputRef}
              type="file"
              accept=".mp3,.wav,.m4a"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Upload the recording to enable playback
            </p>
          </div>

          {/* Contact Name (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g., John Smith"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Override the contact name (defaults to phone number from transcript)
            </p>
          </div>

          {/* Call Date (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Call Date <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={callDate}
              onChange={(e) => setCallDate(e.target.value)}
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Override the call date (defaults to export timestamp)
            </p>
          </div>

          {/* Rep Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Rep <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedRepId}
              onChange={(e) => setSelectedRepId(e.target.value)}
              className="input"
              disabled={loadingReps}
              required
            >
              <option value="">
                {loadingReps ? 'Loading reps...' : 'Select a rep'}
              </option>
              {reps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.full_name || rep.email}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose which rep this call should be attributed to
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              <p>{error}</p>
              {duplicateCallId && (
                <button
                  type="button"
                  onClick={() => router.push(`/calls/${duplicateCallId}`)}
                  className="btn-secondary btn-sm mt-2"
                >
                  View Existing Call
                </button>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || !transcriptFile || !selectedRepId}
            className="btn-primary w-full"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading...
              </span>
            ) : (
              'Import from Ringover'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
