import { useEffect, useState, useRef } from 'react';
import { eventsService, type AppEvent } from '../services/events.service';

export interface UseJobEventsOptions {
  jobId?: string;
  type: 'quiz' | 'flashcard' | 'content' | 'summary';
  onCompleted?: (result: any) => void | Promise<void>;
  onFailed?: (error: string) => void | Promise<void>;
  enabled?: boolean;
}

export const useJobEvents = ({
  jobId,
  type,
  onCompleted,
  onFailed,
  enabled = true,
}: UseJobEventsOptions) => {
  const [status, setStatus] = useState<
    'idle' | 'processing' | 'completed' | 'failed'
  >('idle');
  const [error, setError] = useState<string | null>(null);

  // Use refs to avoid effect dependencies changing
  const callbacksRef = useRef({ onCompleted, onFailed });
  useEffect(() => {
    callbacksRef.current = { onCompleted, onFailed };
  }, [onCompleted, onFailed]);

  useEffect(() => {
    if (!jobId || !enabled) {
      if (status !== 'idle' && !jobId) {
        setStatus('idle');
        setError(null);
      }
      return;
    }

    setStatus('processing');

    // Connect to SSE
    eventsService.connect();

    const handleCompleted = (event: AppEvent) => {
      if (event.jobId === jobId) {
        setStatus('completed');

        // Construct result object similar to what polling returned
        // Attempt to reconstruct result from event metadata
        const result = {
          id: event.resourceId,
          ...(typeof event.metadata === 'object' && event.metadata !== null
            ? event.metadata
            : {}),
        };

        callbacksRef.current.onCompleted?.(result);
      }
    };

    const handleFailed = (event: AppEvent) => {
      if (event.jobId === jobId) {
        setStatus('failed');
        const errorMessage =
          typeof event.error === 'string' ? event.error : 'An error occurred';
        setError(errorMessage);
        callbacksRef.current.onFailed?.(errorMessage);
      }
    };

    // Subscribe to events based on type
    const unsubscribeCompleted = eventsService.on(
      `${type}.completed`,
      handleCompleted
    );
    const unsubscribeFailed = eventsService.on(`${type}.failed`, handleFailed);

    return () => {
      unsubscribeCompleted?.();
      unsubscribeFailed?.();
    };
  }, [jobId, type, enabled, status]);

  return {
    status,
    error,
    isProcessing: status === 'processing',
  };
};
