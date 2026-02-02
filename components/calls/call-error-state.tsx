'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

interface CallErrorStateProps {
  callId: string;
  errorMessage: string | null;
  hasTranscript: boolean;
}

// Error types and suggestions
const ERROR_SUGGESTIONS: Record<string, { title: string; suggestion: string }> = {
  transcription: {
    title: 'Transcription Failed',
    suggestion: 'The audio file could not be processed. Try uploading a clearer recording or paste the transcript directly.',
  },
  scoring: {
    title: 'Scoring Failed',
    suggestion: 'The AI scoring system encountered an error. This is usually temporary - try again in a moment.',
  },
  timeout: {
    title: 'Request Timeout',
    suggestion: 'The operation took too long. This can happen with longer recordings. Try again or split into smaller files.',
  },
  network: {
    title: 'Network Error',
    suggestion: 'Check your internet connection and try again.',
  },
  default: {
    title: 'Processing Failed',
    suggestion: 'An unexpected error occurred. Try again or upload a transcript manually.',
  },
};

function getErrorDetails(errorMessage: string | null): { title: string; suggestion: string } {
  if (!errorMessage) return ERROR_SUGGESTIONS.default;

  const lowerError = errorMessage.toLowerCase();

  if (lowerError.includes('transcri')) return ERROR_SUGGESTIONS.transcription;
  if (lowerError.includes('scor')) return ERROR_SUGGESTIONS.scoring;
  if (lowerError.includes('timeout') || lowerError.includes('timed out')) return ERROR_SUGGESTIONS.timeout;
  if (lowerError.includes('network') || lowerError.includes('fetch')) return ERROR_SUGGESTIONS.network;

  return ERROR_SUGGESTIONS.default;
}

export function CallErrorState({ callId, errorMessage, hasTranscript }: CallErrorStateProps) {
  const router = useRouter();
  const toast = useToast();
  const [retrying, setRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const errorDetails = getErrorDetails(errorMessage);

  const handleRetryScoring = async () => {
    setRetrying(true);

    try {
      const response = await fetch(`/api/calls/${callId}/score`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Scoring failed');
      }

      toast.success('Scoring started', 'The call is being re-scored. Please wait...');
      router.refresh();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Retry failed';
      toast.error('Retry failed', errorMsg);
      setRetryCount(prev => prev + 1);
    } finally {
      setRetrying(false);
    }
  };

  const handleRetryTranscription = async () => {
    setRetrying(true);

    try {
      const response = await fetch(`/api/calls/${callId}/retry-transcription`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Transcription failed');
      }

      toast.success('Transcription started', 'The audio is being re-transcribed. Please wait...');
      router.refresh();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Retry failed';
      toast.error('Retry failed', errorMsg);
      setRetryCount(prev => prev + 1);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="p-4 bg-red-50 border border-red-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-medium text-red-800">{errorDetails.title}</p>
          {errorMessage && (
            <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
          )}
          <p className="text-sm text-red-600 mt-2 bg-red-100/50 p-2 border border-red-200">
            {errorDetails.suggestion}
          </p>

          <div className="flex flex-wrap gap-2 mt-3">
            {hasTranscript ? (
              <button
                onClick={handleRetryScoring}
                disabled={retrying}
                className="btn-primary btn-sm"
              >
                {retrying ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Retrying...
                  </>
                ) : (
                  'Retry Scoring'
                )}
              </button>
            ) : (
              <button
                onClick={handleRetryTranscription}
                disabled={retrying}
                className="btn-primary btn-sm"
              >
                {retrying ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Retrying...
                  </>
                ) : (
                  'Retry Transcription'
                )}
              </button>
            )}

            <button
              onClick={() => router.push('/calls/upload?mode=transcript')}
              className="btn-secondary btn-sm"
            >
              Upload Transcript Instead
            </button>
          </div>

          {retryCount >= 2 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200">
              <p className="text-sm text-yellow-800 font-medium">
                Still having trouble?
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                If retrying doesn&apos;t work, try uploading a written transcript of the call instead of the audio file.
                You can paste the transcript directly on the upload page.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
