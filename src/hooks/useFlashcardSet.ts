import { useQuery } from '@tanstack/react-query';
import { flashcardService } from '../services/flashcard.service';

export const useFlashcardSet = (id: string | undefined) => {
  return useQuery({
    queryKey: ['flashcardSet', id],
    queryFn: () => flashcardService.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
