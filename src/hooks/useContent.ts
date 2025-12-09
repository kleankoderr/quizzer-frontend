import { useQuery } from '@tanstack/react-query';
import { contentService } from '../services';

export const useContent = (id: string | undefined) => {
  return useQuery({
    queryKey: ['content', id],
    queryFn: () => contentService.getById(id!),
    enabled: !!id,
    staleTime: 0,
  });
};
