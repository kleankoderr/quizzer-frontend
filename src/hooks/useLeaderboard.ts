import { useQuery } from '@tanstack/react-query';
import { leaderboardService } from '../services';

export const useLeaderboard = (type: 'global' | 'friends' = 'global') => {
  return useQuery({
    queryKey: ['leaderboard', type],
    queryFn: () =>
      type === 'global'
        ? leaderboardService.getGlobal()
        : leaderboardService.getFriends(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
