import { useQuery } from '@tanstack/react-query';
import {
  gamificationService,
  leaderboardService,
  recommendationService,
} from '../services';

export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [gamificationData, leaderboardData, recommendationsData] =
        await Promise.all([
          gamificationService.loadDashboardData(),
          leaderboardService.getGlobal(),
          recommendationService.getAll(),
        ]);

      return {
        streak: gamificationData.streak,
        leaderboard: leaderboardData.entries.slice(0, 5),
        recommendations: recommendationsData.slice(0, 3),
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
