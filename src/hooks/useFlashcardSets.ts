import { useQuery } from '@tanstack/react-query';
import { flashcardService } from '../services/flashcard.service';

export const useFlashcardSets = () => {
  return useQuery({
    queryKey: ['flashcardSets'],
    queryFn: () => flashcardService.getAll(),
  });
};
