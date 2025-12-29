import { useEffect, useRef, useState, useCallback } from 'react';

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number; // milliseconds
  enabled?: boolean;
}

export function useAutoSave<T>({
  data,
  onSave,
  delay = 3000,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isFirstRender = useRef(true);
  const lastDataRef = useRef<T>(data);
  const enabledRef = useRef(enabled);
  
  // Keep enabled ref in sync
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const save = useCallback(async () => {
    // Check the ref to get the latest enabled value
    if (!enabledRef.current) {
      console.log('Auto-save skipped: not enabled');
      return;
    }

    setStatus('saving');
    try {
      await onSave(data);
      setStatus('saved');
      setLastSaved(new Date());
      lastDataRef.current = data;

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setStatus('error');

      // Reset to idle after 5 seconds on error
      setTimeout(() => {
        setStatus('idle');
      }, 5000);
    }
  }, [data, onSave]);

  useEffect(() => {
    // Skip on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Don't schedule if not enabled
    if (!enabled) {
      // Clear any pending save when disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        setStatus('idle');
      }
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set status to pending
    setStatus('pending');

    // Schedule save
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  const forceSave = useCallback(() => {
    if (!enabledRef.current) {
      console.log('Force save skipped: not enabled');
      return;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    save();
  }, [save]);

  return {
    status,
    lastSaved,
    forceSave,
  };
}
