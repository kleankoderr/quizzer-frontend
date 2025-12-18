import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/user.service.ts';
import type { QuotaStatus } from '../types';

/**
 * Query key for quota data
 */
export const QUOTA_QUERY_KEY = ['quota'];

/**
 * Hook to fetch current user's quota status
 * Uses React Query for caching and automatic refetching
 */
export const useQuota = () => {
  return useQuery<QuotaStatus>({
    queryKey: QUOTA_QUERY_KEY,
    queryFn: () => userService.getQuotaStatus(),
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter than typical because quota changes frequently)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
};

/**
 * Hook to invalidate quota cache
 * Useful after actions that consume quota (generating content, uploading files)
 */
export const useInvalidateQuota = () => {
  const queryClient = useQueryClient();

  return () => {
    return queryClient.invalidateQueries({ queryKey: QUOTA_QUERY_KEY });
  };
};
