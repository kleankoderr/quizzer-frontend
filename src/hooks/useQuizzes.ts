import { useQuery } from '@tanstack/react-query';
import { quizService } from '../services/quiz.service';

export const useQuizzes = () => {
  return useQuery({
    queryKey: ['quizzes'],
    queryFn: () => quizService.getAll(),
  });
};
