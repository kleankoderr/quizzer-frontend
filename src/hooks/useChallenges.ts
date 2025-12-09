import { useQuery } from '@tanstack/react-query';
import { challengeService } from '../services';

export const useChallenges = () => {
  return useQuery({
    queryKey: ['challenges'],
    queryFn: () => challengeService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
