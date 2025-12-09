import { useQuery } from '@tanstack/react-query';
import { userService } from '../services';

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => userService.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
