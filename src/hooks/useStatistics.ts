import { useQuery } from '@tanstack/react-query';
import { statisticsService } from '../services/statistics.service';

export const useStatistics = (page: number = 1) => {
  return useQuery({
    queryKey: ['statistics', page],
    queryFn: async () => {
      const [overviewData, attemptsData, performanceData] = await Promise.all([
        statisticsService.getOverview(),
        statisticsService.getAttempts({ limit: 10, page }),
        statisticsService.getPerformanceByTopic(),
      ]);

      return {
        overview: overviewData,
        attempts: attemptsData.attempts,
        totalPages: attemptsData.totalPages,
        performanceByTopic: performanceData,
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};
