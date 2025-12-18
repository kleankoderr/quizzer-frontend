import { useInfiniteQuery } from '@tanstack/react-query';
import { userDocumentService } from '../services';

export const useUserDocuments = () => {
  return useInfiniteQuery({
    queryKey: ['userDocuments'],
    queryFn: ({ pageParam = 1 }) =>
      userDocumentService.getUserDocuments(pageParam, 20),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.page + 1
        : undefined;
    },
    initialPageParam: 1,
  });
};
