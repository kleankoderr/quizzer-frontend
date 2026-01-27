import { useInfiniteQuery } from '@tanstack/react-query';
import { contentService } from '../services';

export const useContents = (topic?: string, studyPackId?: string) => {
  return useInfiniteQuery({
    queryKey: ['contents', { topic, studyPackId }],
    queryFn: ({ pageParam = 1 }) =>
      contentService.getAll(topic, pageParam, 12, studyPackId),
    getNextPageParam: (lastPage) => {
      return lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined;
    },
    initialPageParam: 1,
  });
};
