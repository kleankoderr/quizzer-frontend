import { useState, useCallback, useRef, useEffect } from 'react';
import { eventsService } from '../services';
import { Toast as toast } from '../utils/toast';

interface UseSummaryGenerationResult {
  startGeneration: (
    jobId: string,
    onComplete?: (shortCode: string) => void
  ) => void;
  isGenerating: boolean;
  streamingContent: string;
}

export const useSummaryGeneration = (): UseSummaryGenerationResult => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const activeJobId = useRef<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const startGeneration = useCallback(
    (jobId: string, onComplete?: (shortCode: string) => void) => {
      // Cleanup previous listeners if any
      if (cleanupRef.current) {
        cleanupRef.current();
      }

      activeJobId.current = jobId;
      setIsGenerating(true);
      setStreamingContent('');

      // 1. Listen for chunks
      const unsubChunk = eventsService.on('summary.chunk', (event: any) => {
        if (event.jobId === jobId) {
          setStreamingContent((prev) => prev + event.chunk);
        }
      });

      // 2. Listen for completion
      const unsubCompleted = eventsService.on(
        'summary.completed',
        (event: any) => {
          if (event.jobId === jobId) {
            setIsGenerating(false);
            activeJobId.current = null;
            cleanup();
            toast.success('Summary successfully generated');
            if (onComplete && event.shortCode) {
              onComplete(event.shortCode);
            }
          }
        }
      );

      // 3. Listen for failure
      const unsubFailed = eventsService.on('summary.failed', (event: any) => {
        if (event.jobId === jobId) {
          setIsGenerating(false);
          activeJobId.current = null;
          cleanup();
          toast.error('Summary generation failed');
        }
      });

      const cleanup = () => {
        unsubChunk();
        unsubCompleted();
        unsubFailed();
        cleanupRef.current = null;
      };

      cleanupRef.current = cleanup;
    },
    []
  );

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return { startGeneration, isGenerating, streamingContent };
};
