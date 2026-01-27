import { useQuery } from '@tanstack/react-query';
import { challengeService } from '../services';

export const useChallenges = () => {
  return useQuery({
    queryKey: ['challenges'],
    queryFn: () => challengeService.getAll(),
  });
};
