import { useInfiniteQuery } from '@tanstack/react-query';
import { flashcardService } from '../services/flashcard.service';

export const useFlashcardSets = (studyPackId?: string) => {
  return useInfiniteQuery({
    queryKey: studyPackId ? ['flashcardSets', studyPackId] : ['flashcardSets'],
    queryFn: ({ pageParam = 1 }) =>
      flashcardService.getAll(pageParam, 20, studyPackId),
    getNextPageParam: (lastPage) => {
      return lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined;
    },
    initialPageParam: 1,
  });
};
