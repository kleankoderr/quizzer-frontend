import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { type AppEvent, eventsService } from '../services/events.service';
import { Toast as toast } from '../utils/toast';

export const GlobalEventListener = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    eventsService.connect();

    const handleSummaryCompleted = (event: AppEvent) => {
      const contentId = event.resourceId; // The content ID from the event

      // Invalidate contents list and specific content item
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      if (contentId) {
        queryClient.invalidateQueries({ queryKey: ['content', contentId] });
      }
    };

    const handleSummaryFailed = (event: AppEvent) => {
      toast.error(
        `Failed to generate summary: ${event.error || 'Unknown error'}`,
        { duration: 5000 }
      );
    };

    const unsubscribeCompleted = eventsService.on(
      'summary.completed',
      handleSummaryCompleted
    );
    const unsubscribeFailed = eventsService.on(
      'summary.failed',
      handleSummaryFailed
    );

    // Global promise rejection handling
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      // Optional: Send to logging service
    };

    globalThis.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      unsubscribeCompleted?.();
      unsubscribeFailed?.();
      globalThis.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [queryClient]);

  return null;
};
