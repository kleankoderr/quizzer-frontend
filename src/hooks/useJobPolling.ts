import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import type { JobStatus, UseJobPollingOptions } from '../types/job';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const POLLING_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Extract user-friendly error message from verbose AI error responses
 */
const extractUserFriendlyError = (error: string): string => {
  // Check for quota exceeded errors
  if (error.includes('quota') || error.includes('Quota')) {
    // Extract the main quota message
    const quotaMatch = error.match(/You exceeded your current quota[^.]*\./);
    if (quotaMatch) {
      return quotaMatch[0];
    }
    return 'API quota exceeded. Please try again later or upgrade your plan.';
  }

  // Check for rate limit errors
  if (error.includes('rate limit') || error.includes('Too Many Requests')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Check for AI generation failures - extract first meaningful sentence
  if (error.includes('AI generation failed:')) {
    const afterPrefix = error.split('AI generation failed:')[1];
    if (afterPrefix) {
      // Get first sentence or first 150 characters
      const firstSentence = afterPrefix.split(/[.!?]\s/)[0];
      if (firstSentence && firstSentence.length < 200) {
        return 'AI generation failed: ' + firstSentence.trim();
      }
    }
  }

  // If error is too long (> 200 chars), truncate it
  if (error.length > 200) {
    return error.substring(0, 197) + '...';
  }

  return error;
};

export const useJobPolling = ({
  jobId,
  endpoint,
  onCompleted,
  onFailed,
  enabled = true,
}: UseJobPollingOptions) => {
  const startTimeRef = useRef<number>(Date.now());
  const previousStatusRef = useRef<string | null>(null);
  const attemptCountRef = useRef<number>(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['job-status', endpoint, jobId],
    queryFn: async (): Promise<JobStatus> => {
      if (!jobId) throw new Error('No job ID provided');

      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_BASE_URL}/${endpoint}/status/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        // Parse error response
        let errorMessage = 'Failed to fetch job status';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (_e) {
          // If parsing fails, use default message
        }

        // For 404, treat as job not found (likely expired or never existed)
        if (response.status === 404) {
          // Return a failed job status instead of throwing
          return {
            jobId: jobId,
            status: 'failed',
            progress: 0,
            error: errorMessage,
          };
        }

        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      // Handle new API response format where job status is wrapped in 'data'
      const jobStatus: JobStatus = responseData.data || responseData;

      // Extract user-friendly error message from verbose AI errors
      if (jobStatus.status === 'failed' && jobStatus.error) {
        jobStatus.error = extractUserFriendlyError(jobStatus.error);
      }

      return jobStatus;
    },
    enabled: enabled && !!jobId && !hasTimedOut,
    refetchInterval: (query) => {
      const data = query.state.data;

      // Stop polling if job is completed or failed
      if (!data || data.status === 'completed' || data.status === 'failed') {
        return false;
      }

      // Check for timeout
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed > POLLING_TIMEOUT_MS) {
        return false;
      }

      // Exponential backoff: start=500ms, multiplier=3, max=10s
      // Intervals: 500ms → 1.5s → 4.5s → 10s → 10s
      attemptCountRef.current += 1;
      const interval = Math.min(
        500 * Math.pow(3, attemptCountRef.current - 1),
        10000
      );

      return interval;
    },
    retry: 5, // Max 5 retry attempts
    retryDelay: (attemptIndex) => {
      // Exponential retry delay for errors: 500ms, 1.5s, 4.5s, 10s
      return Math.min(500 * Math.pow(3, attemptIndex), 10000);
    },
  });

  // Handle timeout
  useEffect(() => {
    if (!jobId || !enabled) return;

    const timeoutId = setTimeout(() => {
      if (data?.status !== 'completed' && data?.status !== 'failed') {
        setHasTimedOut(true);
        if (onFailed) {
          onFailed(
            'The task is taking longer than expected. Please try again or contact support if the issue persists.'
          );
        }
      }
    }, POLLING_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [jobId, enabled, data?.status, onFailed]);

  // Handle job completion/failure - only trigger once per status change
  useEffect(() => {
    if (!data || previousStatusRef.current === data.status) return;

    const previousStatus = previousStatusRef.current;
    previousStatusRef.current = data.status;

    // Only trigger callbacks on actual status transitions
    if (
      data.status === 'completed' &&
      previousStatus !== 'completed' &&
      onCompleted
    ) {
      onCompleted(data.result);
    } else if (
      data.status === 'failed' &&
      previousStatus !== 'failed' &&
      onFailed
    ) {
      onFailed(data.error || 'Job failed');
    }
  }, [data?.status, onCompleted, onFailed]);

  // Reset refs when jobId changes
  useEffect(() => {
    if (jobId) {
      startTimeRef.current = Date.now();
      previousStatusRef.current = null;
      attemptCountRef.current = 0;
      setHasTimedOut(false);
    }
  }, [jobId]);

  return {
    data,
    isLoading,
    error,
    isPolling:
      enabled &&
      !!jobId &&
      !hasTimedOut &&
      data?.status !== 'completed' &&
      data?.status !== 'failed',
  };
};
