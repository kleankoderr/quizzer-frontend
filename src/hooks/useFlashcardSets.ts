import { useQuery } from '@tanstack/react-query';
import { flashcardService } from '../services/flashcard.service';

export const useFlashcardSets = () => {
  return useQuery({
    queryKey: ['flashcardSets'],
    queryFn: () => flashcardService.getAll(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
