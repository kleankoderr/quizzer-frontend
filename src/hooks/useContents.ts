import { useQuery } from '@tanstack/react-query';
import { contentService } from '../services';

export const useContents = (
  topic?: string,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: ['contents', topic, page, limit],
    queryFn: async () => {
      const response = await contentService.getAll(topic, page, limit);
      if (Array.isArray(response)) {
        return {
          data: response,
          meta: { totalPages: 1, currentPage: 1, total: response.length },
        };
      }
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
