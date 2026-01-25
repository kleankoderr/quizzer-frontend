import { useInfiniteQuery } from '@tanstack/react-query';
import { quizService } from '../services/quiz.service';

export const useQuizzes = (studyPackId?: string) => {
  return useInfiniteQuery({
    queryKey: studyPackId ? ['quizzes', studyPackId] : ['quizzes'],
    queryFn: ({ pageParam = 1 }) =>
      quizService.getAll(pageParam, 20, studyPackId),
    getNextPageParam: (lastPage) => {
      return lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined;
    },
    initialPageParam: 1,
  });
};
