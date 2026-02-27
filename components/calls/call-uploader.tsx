'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import type { CallContext } from '@/types/database';

interface RepOption {
  id: string;
  email: string;
  full_name: string | null;
}

interface CallUploaderProps {
  // Scripts prop kept for backwards compatibility but not used
  scripts?: { id: string; name: string; course: string }[];
  // For managers/admins to select which rep the call belongs to
  isManager?: boolean;
  reps?: RepOption[];
  currentUserId?: string;
}

type UploadMode = 'audio' | 'transcript';

export function CallUploader({ isManager = false, reps = [], currentUserId }: CallUploaderProps) {
  const router = useRouter();
  const [mode, setMode] = useState<UploadMode>('transcript');
  const [file, setFile] = useState<File | null>(null);
  const [transcriptText, setTranscriptText] = useState('');
  const [contactName, setContactName] = useState('');
  const [callDate, setCallDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedRepId, setSelectedRepId] = useState<string>(currentUserId || '');
  const [callContext, setCallContext] = useState<CallContext>('new_lead');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const onDropAudio = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];

      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mp4'];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp3|wav|m4a|mp4)$/i)) {
        setError('Please upload an audio file (MP3, WAV, M4A, or MP4)');
        return;
      }

      // Validate file size (max 100MB)
      if (selectedFile.size > 100 * 1024 * 1024) {
        setError('File size must be less than 100MB');
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  }, []);

  const onDropTranscript = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];

      // Validate file type
      if (!selectedFile.name.match(/\.(txt|text)$/i) && selectedFile.type !== 'text/plain') {
        setError('Please upload a text file (.txt)');
        return;
      }

      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setTranscriptText(content);
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to read file');
      };
      reader.readAsText(selectedFile);
    }
  }, []);

  const audioDropzone = useDropzone({
    onDrop: onDropAudio,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.mp4'],
    },
    maxFiles: 1,
    disabled: mode !== 'audio',
  });

  const transcriptDropzone = useDropzone({
    onDrop: onDropTranscript,
    accept: {
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: mode !== 'transcript',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'audio' && !file) {
      setError('Please select an audio file to upload');
      return;
    }

    if (mode === 'transcript' && !transcriptText.trim()) {
      setError('Please enter or upload a transcript');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(mode === 'audio' ? 'Uploading file...' : 'Processing transcript...');

    try {
      // Create form data
      const formData = new FormData();
      formData.append('mode', mode);
      formData.append('contactName', contactName);
      formData.append('callDate', callDate);
      formData.append('callContext', callContext);

      // If manager is uploading for a specific rep
      if (isManager && selectedRepId) {
        formData.append('repId', selectedRepId);
      }

      if (mode === 'audio' && file) {
        formData.append('file', file);
      } else if (mode === 'transcript') {
        formData.append('transcript', transcriptText);
      }

      // Upload to API
      const response = await fetch('/api/calls', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload call');
      }

      const { callId } = await response.json();

      setProgress('Complete! Redirecting...');

      // Redirect to call detail page
      router.push(`/calls/${callId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setProgress(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode Toggle */}
      <div className="card">
        <h3 className="card-header">Upload Type</h3>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              setMode('transcript');
              setFile(null);
              setError(null);
            }}
            className={`flex-1 p-4 border-2 transition-colors ${
              mode === 'transcript'
                ? 'border-primary bg-primary-50 text-primary'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <svg
              className="mx-auto h-8 w-8 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="font-medium">Transcript</span>
            <p className="text-xs text-gray-500 mt-1">Paste or upload text</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('audio');
              setTranscriptText('');
              setError(null);
            }}
            className={`flex-1 p-4 border-2 transition-colors ${
              mode === 'audio'
                ? 'border-primary bg-primary-50 text-primary'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <svg
              className="mx-auto h-8 w-8 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <span className="font-medium">Audio File</span>
            <p className="text-xs text-gray-500 mt-1">MP3, WAV, M4A</p>
          </button>
        </div>
      </div>

      {/* Transcript Input */}
      {mode === 'transcript' && (
        <div className="card">
          <h3 className="card-header">Call Transcript</h3>

          <div className="space-y-4">
            <div
              {...transcriptDropzone.getRootProps()}
              className={`border-2 border-dashed p-4 text-center cursor-pointer transition-colors ${
                transcriptDropzone.isDragActive
                  ? 'border-primary bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...transcriptDropzone.getInputProps()} />
              <p className="text-sm text-gray-600">
                Drop a .txt file here, or click to select
              </p>
            </div>

            <div className="text-center text-sm text-gray-500">or paste transcript below</div>

            <textarea
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              placeholder="Paste your call transcript here...

Example format:
REP: Hi Sarah, this is John from MyEdSpace. Thanks for booking time with me.
PROSPECT: Hi John, yes I wanted to learn more about your math program.
REP: Great! So what's going on with math that made you reach out?
..."
              className="input min-h-[300px] font-mono text-sm"
              rows={15}
            />

            <p className="text-xs text-gray-500">
              Tip: Label speakers as REP: and PROSPECT: (or PARENT:) for better scoring accuracy.
            </p>
          </div>
        </div>
      )}

      {/* Audio File Upload */}
      {mode === 'audio' && (
        <div className="card">
          <h3 className="card-header">Recording File</h3>

          <div
            {...audioDropzone.getRootProps()}
            className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
              audioDropzone.isDragActive
                ? 'border-primary bg-primary-50'
                : file
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...audioDropzone.getInputProps()} />

            {file ? (
              <div>
                <svg
                  className="mx-auto h-12 w-12 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="mt-2 text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="mt-2 text-sm text-red-600 hover:text-red-700"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  {audioDropzone.isDragActive
                    ? 'Drop the file here'
                    : 'Drag and drop an audio file, or click to select'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  MP3, WAV, M4A, or MP4 up to 100MB
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Call Details */}
      <div className="card">
        <h3 className="card-header">Call Details</h3>

        <div className="space-y-4">
          {/* Rep Selection - Only shown to managers/admins */}
          {isManager && reps.length > 0 && (
            <div>
              <label htmlFor="repId" className="label">
                Sales Rep <span className="text-red-500">*</span>
              </label>
              <select
                id="repId"
                value={selectedRepId}
                onChange={(e) => setSelectedRepId(e.target.value)}
                className="input"
                required
              >
                <option value="">-- Select Rep --</option>
                {reps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.full_name || rep.email}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select which sales rep this call belongs to
              </p>
            </div>
          )}

          <div>
            <label htmlFor="contactName" className="label">
              Contact/Prospect Name
            </label>
            <input
              id="contactName"
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="input"
              placeholder="e.g., Sarah Johnson"
            />
          </div>

          <div>
            <label htmlFor="callDate" className="label">
              Call Date
            </label>
            <input
              id="callDate"
              type="date"
              value={callDate}
              onChange={(e) => setCallDate(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="callContext" className="label">
              Call Type
            </label>
            <select
              id="callContext"
              value={callContext}
              onChange={(e) => setCallContext(e.target.value as CallContext)}
              className="input"
            >
              <option value="new_lead">New Lead — first ever interaction</option>
              <option value="booked_call">Booked Call — they booked a call, we have some info</option>
              <option value="warm_lead">Warm Lead — already been messaging/chatting</option>
              <option value="follow_up">Follow-Up — returning from a previous call</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              This adjusts which phases are scored. Warm leads and follow-ups skip discovery phases.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* Progress Message */}
      {progress && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700">
          {progress}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
          disabled={uploading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={
            uploading ||
            (mode === 'audio' ? !file : !transcriptText.trim()) ||
            (isManager && reps.length > 0 && !selectedRepId)
          }
        >
          {uploading ? 'Processing...' : 'Upload & Score'}
        </button>
      </div>

      {/* Info Box */}
      <div className="card bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          {mode === 'audio' ? (
            <>
              <li>Your recording will be uploaded to secure storage</li>
              <li>Audio will be transcribed using AI (Whisper)</li>
            </>
          ) : (
            <li>Your transcript will be processed</li>
          )}
          <li>The transcript will be scored against the CLOSER framework</li>
          <li>You&apos;ll receive detailed feedback and improvement suggestions</li>
        </ol>
        {mode === 'audio' && (
          <p className="mt-2 text-xs text-gray-500">
            Processing typically takes 2-5 minutes depending on call length.
          </p>
        )}
      </div>
    </form>
  );
}
