import { useQuery } from '@tanstack/react-query';
import { quizService } from '../services/quiz.service';

export const useQuiz = (id: string | undefined) => {
  return useQuery({
    queryKey: ['quiz', id],
    queryFn: () => quizService.getById(id!),
    enabled: !!id,
  });
};
