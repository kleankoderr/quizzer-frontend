import { useQuery } from "@tanstack/react-query";
import { statisticsService } from "../services/statistics.service";

interface AttemptsFilters {
  quizId?: string;
  flashcardSetId?: string;
  challengeId?: string;
  limit?: number;
  page?: number;
}

export const useAttempts = (filters: AttemptsFilters = {}) => {
  return useQuery({
    queryKey: ["attempts", filters],
    queryFn: () => statisticsService.getAttempts(filters),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};
