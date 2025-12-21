import { useState, useEffect, useRef, useCallback } from 'react';
import { summaryService } from '../services/summary.service';
import { Toast as toast } from '../utils/toast';

interface UseSummaryGenerationResult {
  startPolling: (
    jobId: string,
    onComplete?: (summaryId: string) => void
  ) => void;
  isPolling: boolean;
}

export const useSummaryGeneration = (): UseSummaryGenerationResult => {
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poll = useCallback(
    async (
      jobId: string,
      attempt: number,
      onComplete?: (shortCode: string) => void
    ) => {
      if (!pollingRef.current) return;

      try {
        const status = await summaryService.getGenerationStatus(jobId);

        if (status.state === 'completed') {
          pollingRef.current = false;
          setIsPolling(false);
          toast.success('Summary successfully generated');
          if (onComplete && status.result?.shortCode) {
            onComplete(status.result.shortCode);
          }
          return;
        }

        if (status.state === 'failed') {
          pollingRef.current = false;
          setIsPolling(false);
          toast.error('Summary generation failed');
          return;
        }

        // Exponential backoff: start at 1s, multiply by 1.5, cap at 10s
        const delay = Math.min(1000 * Math.pow(1.5, attempt), 10000);

        timeoutRef.current = setTimeout(() => {
          poll(jobId, attempt + 1, onComplete);
        }, delay);
      } catch (error) {
        console.error('Polling error:', error);
        // Check if it's a 404 (job not found) or other potentially fatal error to stop polling?
        // For now, valid keep retrying with backoff as it might be network glitch
        const delay = Math.min(1000 * Math.pow(1.5, attempt), 10000);
        timeoutRef.current = setTimeout(() => {
          poll(jobId, attempt + 1, onComplete);
        }, delay);
      }
    },
    []
  );

  const startPolling = useCallback(
    (jobId: string, onComplete?: (shortCode: string) => void) => {
      if (pollingRef.current) return; // Already polling

      pollingRef.current = true;
      setIsPolling(true);
      poll(jobId, 0, onComplete);
    },
    [poll]
  );

  useEffect(() => {
    return () => {
      pollingRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { startPolling, isPolling };
};
