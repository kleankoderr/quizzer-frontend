import { apiClient } from './api';
import {
  STREAK_ENDPOINTS,
  LEADERBOARD_ENDPOINTS,
  RECOMMENDATION_ENDPOINTS,
  ATTEMPTS_ENDPOINTS,
  ONBOARDING_ENDPOINTS,
} from '../config/api';
import type {
  Streak,
  UpdateStreakRequest,
  Recommendation,
  Attempt,
  Leaderboard,
} from '../types';

export const streakService = {
  getCurrent: async (): Promise<Streak> => {
    const response = await apiClient.get<Streak>(STREAK_ENDPOINTS.GET_CURRENT);
    return response.data;
  },

  update: async (data?: UpdateStreakRequest): Promise<Streak> => {
    const response = await apiClient.post<Streak>(
      STREAK_ENDPOINTS.UPDATE,
      data
    );
    return response.data;
  },
};

export const leaderboardService = {
  getGlobal: async (): Promise<Leaderboard> => {
    const response = await apiClient.get<Leaderboard>(
      LEADERBOARD_ENDPOINTS.GLOBAL
    );
    return {
      entries: response.data.entries,
      currentUser: response.data.currentUser,
      userRank: response.data.currentUser?.rank,
    };
  },

  getFriends: async (): Promise<Leaderboard> => {
    const response = await apiClient.get<Leaderboard>(
      LEADERBOARD_ENDPOINTS.FRIENDS
    );
    return {
      entries: response.data.entries,
      currentUser: response.data.currentUser,
      userRank: response.data.currentUser?.rank,
    };
  },
};

export const recommendationService = {
  getAll: async (): Promise<Recommendation[]> => {
    const response = await apiClient.get<Recommendation[]>(
      RECOMMENDATION_ENDPOINTS.GET_ALL
    );
    return response.data;
  },

  dismiss: async (id: string): Promise<void> => {
    await apiClient.patch(RECOMMENDATION_ENDPOINTS.DISMISS(id));
  },
};

export const attemptService = {
  getAll: async (): Promise<Attempt[]> => {
    const response = await apiClient.get<Attempt[]>(ATTEMPTS_ENDPOINTS.GET_ALL);
    return response.data;
  },

  getById: async (id: string): Promise<Attempt> => {
    const response = await apiClient.get<Attempt>(
      ATTEMPTS_ENDPOINTS.GET_BY_ID(id)
    );
    return response.data;
  },

  getByQuizId: async (quizId: string): Promise<Attempt[]> => {
    const response = await apiClient.get<Attempt[]>(`/attempts/quiz/${quizId}`);
    return response.data;
  },

  getByFlashcardId: async (flashcardId: string): Promise<Attempt[]> => {
    const response = await apiClient.get<Attempt[]>(
      `/attempts/flashcard/${flashcardId}`
    );
    return response.data;
  },
};

export const onboardingService = {
  getStatus: async (): Promise<{
    status: 'NOT_STARTED' | 'PENDING' | 'COMPLETED';
    quizId?: string;
  }> => {
    const response = await apiClient.get(ONBOARDING_ENDPOINTS.GET_STATUS);
    return response.data;
  },
};

export { challengeService } from './challenge.service';
export { gamificationService } from './gamification.service';
export { contentService } from './content.service';
export { coachingService } from './coaching.service';
export { userService } from './user.service';
export { userDocumentService } from './user-document.service';
export { summaryService } from './summary.service';
export { studyPackService } from './studyPackService';
export { authService } from './auth.service';
export { quizService } from './quiz.service';
export { flashcardService } from './flashcard.service';
export { subscriptionService } from './subscription.service';
export { weakAreaService } from './weak-area.service';
export { statisticsService } from './statistics.service';
export { searchService } from './searchService';
export { settingsService } from './settingsService';
export { adminService } from './adminService';
export { schoolService } from './school.service';
export { quoteService } from './quote.service';
export { studyService } from './study.service';
export { eventsService } from './events.service';
export * from './task.service';
