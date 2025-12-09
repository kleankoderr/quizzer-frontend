import { apiClient } from './api';
import {
  STREAK_ENDPOINTS,
  LEADERBOARD_ENDPOINTS,
  RECOMMENDATION_ENDPOINTS,
  ATTEMPTS_ENDPOINTS,
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

export { challengeService } from './challenge.service';

export const recommendationService = {
  getAll: async (): Promise<Recommendation[]> => {
    const response = await apiClient.get<Recommendation[]>(
      RECOMMENDATION_ENDPOINTS.GET_ALL
    );
    return response.data;
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

export { gamificationService } from './gamification.service';
export { contentService } from './content.service';
export { coachingService } from './coaching.service';
export { userService } from './user.service';
export * from './task.service';
