import { useEffect, useRef, useCallback } from 'react';

const STORAGE_PREFIX = 'repcoach_draft_';

interface AutoSaveOptions {
  key: string;
  debounceMs?: number;
  onRestore?: (data: unknown) => void;
}

interface SavedDraft<T> {
  data: T;
  timestamp: number;
  version: number;
}

const CURRENT_VERSION = 1;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useAutoSave<T>({ key, debounceMs = 1000, onRestore }: AutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = `${STORAGE_PREFIX}${key}`;

  // Save to localStorage
  const save = useCallback((data: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        const draft: SavedDraft<T> = {
          data,
          timestamp: Date.now(),
          version: CURRENT_VERSION,
        };
        localStorage.setItem(storageKey, JSON.stringify(draft));
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, debounceMs);
  }, [storageKey, debounceMs]);

  // Save immediately without debounce
  const saveNow = useCallback((data: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    try {
      const draft: SavedDraft<T> = {
        data,
        timestamp: Date.now(),
        version: CURRENT_VERSION,
      };
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [storageKey]);

  // Restore from localStorage
  const restore = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;

      const draft: SavedDraft<T> = JSON.parse(saved);

      // Check version and age
      if (draft.version !== CURRENT_VERSION) return null;
      if (Date.now() - draft.timestamp > MAX_AGE_MS) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return draft.data;
    } catch (error) {
      console.error('Auto-restore failed:', error);
      return null;
    }
  }, [storageKey]);

  // Clear saved draft
  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Clear draft failed:', error);
    }
  }, [storageKey]);

  // Check if draft exists
  const hasDraft = useCallback((): boolean => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return false;

      const draft: SavedDraft<T> = JSON.parse(saved);
      if (draft.version !== CURRENT_VERSION) return false;
      if (Date.now() - draft.timestamp > MAX_AGE_MS) return false;

      return true;
    } catch {
      return false;
    }
  }, [storageKey]);

  // Get draft age
  const getDraftAge = useCallback((): number | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;

      const draft: SavedDraft<T> = JSON.parse(saved);
      return Date.now() - draft.timestamp;
    } catch {
      return null;
    }
  }, [storageKey]);

  // Restore on mount if callback provided
  useEffect(() => {
    if (onRestore) {
      const data = restore();
      if (data) {
        onRestore(data);
      }
    }
  }, [onRestore, restore]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    save,
    saveNow,
    restore,
    clear,
    hasDraft,
    getDraftAge,
  };
}

// Format time ago for display
export function formatTimeAgo(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}
