import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationService } from '../services';

export const useRecommendations = () => {
  const queryClient = useQueryClient();

  const {
    data: recommendations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: recommendationService.getAll,
    staleTime: 1000 * 60 * 10,
  });

  const dismissMutation = useMutation({
    mutationFn: recommendationService.dismiss,
    onSuccess: (_, recommendationId) => {
      // Optimistically remove the item from cache
      queryClient.setQueryData(['ai-recommendations'], (oldData: any[]) => {
        if (!oldData) return [];
        return oldData.filter((rec) => rec.id !== recommendationId);
      });
      // Trigger background refetch
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    },
  });

  return {
    recommendations,
    isLoading,
    error,
    dismiss: dismissMutation.mutate,
    isDismissing: dismissMutation.isPending,
  };
};
