import { apiClient } from "./api";
import {
  STREAK_ENDPOINTS,
  LEADERBOARD_ENDPOINTS,
  CHALLENGE_ENDPOINTS,
  RECOMMENDATION_ENDPOINTS,
  ATTEMPTS_ENDPOINTS,
} from "../config/api";
import type {
  Streak,
  UpdateStreakRequest,
  LeaderboardEntry,
  Challenge,
  CompleteChallengeRequest,
  Recommendation,
  Attempt,
  Leaderboard,
} from "../types";

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
    const response = await apiClient.get<{ entries: LeaderboardEntry[] }>(
      LEADERBOARD_ENDPOINTS.GLOBAL
    );
    // Map avatar and userName for compatibility
    const entries = response.data.entries.map((entry) => ({
      ...entry,
      avatar: entry.user?.avatar,
      userName: entry.user?.name,
    }));
    return { entries };
  },

  getFriends: async (): Promise<Leaderboard> => {
    const response = await apiClient.get<{ entries: LeaderboardEntry[] }>(
      LEADERBOARD_ENDPOINTS.FRIENDS
    );
    const entries = response.data.entries.map((entry) => ({
      ...entry,
      avatar: entry.user?.avatar,
      userName: entry.user?.name,
    }));
    return { entries };
  },
};

export const challengeService = {
  getAll: async (): Promise<Challenge[]> => {
    const response = await apiClient.get<Challenge[]>(
      CHALLENGE_ENDPOINTS.GET_ALL
    );
    return response.data;
  },

  getDaily: async (): Promise<Challenge[]> => {
    const response = await apiClient.get<Challenge[]>(
      CHALLENGE_ENDPOINTS.GET_DAILY
    );
    return response.data;
  },

  getById: async (id: string): Promise<Challenge> => {
    const response = await apiClient.get<Challenge>(
      CHALLENGE_ENDPOINTS.GET_BY_ID(id)
    );
    return response.data;
  },

  complete: async (data: CompleteChallengeRequest): Promise<Challenge> => {
    const response = await apiClient.post<Challenge>(
      CHALLENGE_ENDPOINTS.COMPLETE,
      data
    );
    return response.data;
  },

  join: async (challengeId: string): Promise<Challenge> => {
    const response = await apiClient.post<Challenge>(CHALLENGE_ENDPOINTS.JOIN, {
      challengeId,
    });
    return response.data;
  },
};

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
};

export { gamificationService } from "./gamification.service";
export { contentService } from "./content.service";
export { userService } from "./user.service";
