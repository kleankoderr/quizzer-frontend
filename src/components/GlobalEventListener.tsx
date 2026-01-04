import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { eventsService, type AppEvent } from '../services/events.service';
import { Toast as toast } from '../utils/toast';

export const GlobalEventListener = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    eventsService.connect();

    const handleSummaryCompleted = (event: AppEvent) => {
      const { contentTitle } = event.metadata || {};
      const contentId = event.resourceId; // The content ID from the event
      
      toast.success(
        contentTitle 
          ? `Summary for "${contentTitle}" is ready!` 
          : 'Summary is ready!',
        { duration: 5000 }
      );

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

    const unsubscribeCompleted = eventsService.on('summary.completed', handleSummaryCompleted);
    const unsubscribeFailed = eventsService.on('summary.failed', handleSummaryFailed);

    return () => {
      unsubscribeCompleted?.();
      unsubscribeFailed?.();
    };
  }, [queryClient]);

  return null;
};
