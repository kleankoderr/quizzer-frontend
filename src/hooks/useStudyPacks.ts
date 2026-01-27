import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { studyPackService } from '../services';

export const useStudyPacks = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['studyPacks', page, limit],
    queryFn: () => studyPackService.getAll(page, limit),
    placeholderData: keepPreviousData,
  });
};
