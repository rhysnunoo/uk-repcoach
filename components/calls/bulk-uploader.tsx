'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';

interface RepOption {
  id: string;
  email: string;
  full_name: string | null;
}

interface UploadedFile {
  file: File;
  content: string;
  contactName: string;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
  callId?: string;
}

interface BulkUploaderProps {
  isManager?: boolean;
  reps?: RepOption[];
  currentUserId?: string;
}

export function BulkUploader({ isManager = false, reps = [], currentUserId }: BulkUploaderProps) {
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [selectedRepId, setSelectedRepId] = useState<string>(currentUserId || '');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = [];

    for (const file of acceptedFiles) {
      // Read file content
      const content = await readFileContent(file);

      // Extract contact name from filename
      const contactName = file.name
        .replace(/\.(txt|text)$/i, '')
        .replace(/_/g, ' ')
        .replace(/-/g, ' ');

      newFiles.push({
        file,
        content,
        contactName,
        status: 'pending',
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
    },
    multiple: true,
  });

  const updateContactName = (index: number, name: string) => {
    setFiles(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], contactName: name };
      return updated;
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAll = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setCompleted(0);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'complete') continue;

      // Update status to uploading
      setFiles(prev => {
        const updated = [...prev];
        updated[i] = { ...updated[i], status: 'uploading' };
        return updated;
      });

      try {
        const formData = new FormData();
        formData.append('mode', 'transcript');
        formData.append('transcript', files[i].content);
        formData.append('contactName', files[i].contactName);
        formData.append('callDate', new Date().toISOString().split('T')[0]);

        // If manager is uploading for a specific rep
        if (isManager && selectedRepId) {
          formData.append('repId', selectedRepId);
        }

        const response = await fetch('/api/calls', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Upload failed');
        }

        const { callId } = await response.json();

        setFiles(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: 'complete', callId };
          return updated;
        });

        setCompleted(prev => prev + 1);
      } catch (err) {
        setFiles(prev => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            status: 'error',
            error: err instanceof Error ? err.message : 'Upload failed',
          };
          return updated;
        });
      }
    }

    setUploading(false);
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const completeCount = files.filter(f => f.status === 'complete').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Rep Selection - Only shown to managers/admins */}
      {isManager && reps.length > 0 && (
        <div className="card">
          <h3 className="card-header">Sales Rep</h3>
          <div>
            <label htmlFor="bulkRepId" className="label">
              Upload calls for: <span className="text-red-500">*</span>
            </label>
            <select
              id="bulkRepId"
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
              All uploaded calls will be assigned to this sales rep
            </p>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
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
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="mt-4 text-lg font-medium text-gray-900">
          Drop transcript files here
        </p>
        <p className="mt-2 text-sm text-gray-500">
          or click to select multiple .txt files
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </h3>
            <div className="text-sm text-gray-500">
              {completeCount > 0 && (
                <span className="text-green-600 mr-3">{completeCount} complete</span>
              )}
              {errorCount > 0 && (
                <span className="text-red-600 mr-3">{errorCount} failed</span>
              )}
              {pendingCount > 0 && (
                <span>{pendingCount} pending</span>
              )}
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 border ${
                  file.status === 'complete'
                    ? 'bg-green-50 border-green-200'
                    : file.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : file.status === 'uploading'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2">
                    {file.status === 'uploading' && (
                      <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {file.status === 'complete' && (
                      <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {file.status === 'error' && (
                      <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </span>
                  </div>

                  {file.status === 'pending' && (
                    <input
                      type="text"
                      value={file.contactName}
                      onChange={(e) => updateContactName(index, e.target.value)}
                      placeholder="Contact name"
                      className="mt-2 input input-sm text-sm"
                    />
                  )}

                  {file.status === 'error' && file.error && (
                    <p className="text-xs text-red-600 mt-1">{file.error}</p>
                  )}

                  {file.status === 'complete' && file.callId && (
                    <a
                      href={`/calls/${file.callId}`}
                      className="text-xs text-primary hover:text-primary-dark mt-1 inline-block"
                    >
                      View call →
                    </a>
                  )}
                </div>

                {file.status === 'pending' && (
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setFiles([])}
              disabled={uploading}
              className="btn-secondary btn-sm"
            >
              Clear All
            </button>
            <div className="flex gap-2">
              {completeCount > 0 && (
                <button
                  onClick={() => router.push('/calls')}
                  className="btn-secondary"
                >
                  View Calls
                </button>
              )}
              <button
                onClick={uploadAll}
                disabled={uploading || pendingCount === 0 || (isManager && reps.length > 0 && !selectedRepId)}
                className="btn-primary"
              >
                {uploading
                  ? `Uploading ${completed + 1}/${files.length}...`
                  : `Upload ${pendingCount} File${pendingCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-2">Bulk Upload Tips</h4>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Name your files with the contact name (e.g., &quot;John_Smith.txt&quot;)</li>
          <li>Each file should contain one transcript</li>
          <li>Use &quot;REP:&quot; and &quot;PROSPECT:&quot; labels for speaker identification</li>
          <li>Files will be processed and scored automatically</li>
        </ul>
      </div>
    </div>
  );
}

async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
