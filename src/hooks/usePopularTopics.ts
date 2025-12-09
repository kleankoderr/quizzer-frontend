import { useQuery } from '@tanstack/react-query';
import { contentService } from '../services';

export const usePopularTopics = () => {
  return useQuery({
    queryKey: ['popularTopics'],
    queryFn: () => contentService.getPopularTopics(),
    staleTime: 10 * 60 * 1000, // 10 minutes - popular topics don't change frequently
  });
};
