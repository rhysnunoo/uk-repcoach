'use client';

import { useEffect, useState, useRef } from 'react';

interface AsyncErrorFallbackProps {
  error: Error | null;
  resetErrorBoundary?: () => void;
  title?: string;
  showRetry?: boolean;
}

export function AsyncErrorFallback({
  error,
  resetErrorBoundary,
  title = 'Failed to load data',
  showRetry = true,
}: AsyncErrorFallbackProps) {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount((prev) => prev + 1);
      resetErrorBoundary?.();
    }
  };

  const isNetworkError = error?.message?.toLowerCase().includes('network') ||
    error?.message?.toLowerCase().includes('fetch');

  const isRateLimitError = error?.message?.toLowerCase().includes('rate limit') ||
    error?.message?.toLowerCase().includes('429');

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {isNetworkError ? (
            <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">{title}</h3>
          <p className="mt-1 text-sm text-yellow-700">
            {isNetworkError
              ? 'Please check your internet connection and try again.'
              : isRateLimitError
              ? 'Too many requests. Please wait a moment and try again.'
              : error?.message || 'An unexpected error occurred.'}
          </p>
          {showRetry && resetErrorBoundary && (
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={handleRetry}
                disabled={retryCount >= maxRetries}
                className="text-sm font-medium text-yellow-800 hover:text-yellow-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {retryCount >= maxRetries ? 'Max retries reached' : 'Retry'}
              </button>
              {retryCount > 0 && (
                <span className="text-xs text-yellow-600">
                  Attempt {retryCount}/{maxRetries}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Auto-retry wrapper for async operations
 */
export function useAutoRetry<T>(
  asyncFn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onError?: (error: Error, attempt: number) => void;
  } = {}
) {
  const { maxRetries = 3, retryDelay = 1000, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const asyncFnRef = useRef(asyncFn);
  asyncFnRef.current = asyncFn;

  const execute = async () => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setLoading(true);
        const result = await asyncFnRef.current();
        setData(result);
        setError(null);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        onError?.(lastError, attempt);
        setRetryCount(attempt);

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    setError(lastError);
    setLoading(false);
    return null;
  };

  const retry = () => {
    setRetryCount(0);
    execute();
  };

  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, error, loading, retry, retryCount };
}
