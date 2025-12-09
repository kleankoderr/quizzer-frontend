import { useQuery } from '@tanstack/react-query';
import { taskService } from '../services';

export const useTaskStatus = (taskId: string | null) => {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskService.getStatus(taskId!),
    enabled: !!taskId,
    refetchInterval: (query) => {
      // Stop polling if task is completed or failed
      const data = query.state.data;
      if (data?.status === 'COMPLETED' || data?.status === 'FAILED') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });
};
