import { apiClient } from "./api";
import { CHALLENGE_ENDPOINTS } from "../config/api";
import type { Challenge, CompleteChallengeRequest } from "../types";

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

  getHot: async (): Promise<Challenge[]> => {
    const response = await apiClient.get<Challenge[]>(
      CHALLENGE_ENDPOINTS.GET_HOT
    );
    return response.data;
  },

  getWeekly: async (): Promise<Challenge[]> => {
    const response = await apiClient.get<Challenge[]>(
      CHALLENGE_ENDPOINTS.GET_WEEKLY
    );
    return response.data;
  },

  getMonthly: async (): Promise<Challenge[]> => {
    const response = await apiClient.get<Challenge[]>(
      CHALLENGE_ENDPOINTS.GET_MONTHLY
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

  leave: async (challengeId: string): Promise<void> => {
    await apiClient.post(CHALLENGE_ENDPOINTS.LEAVE, {
      challengeId,
    });
  },

  getChallengeById: async (id: string): Promise<Challenge> => {
    const response = await apiClient.get<Challenge>(`/challenges/${id}`);
    return response.data;
  },

  startChallenge: async (id: string): Promise<any> => {
    const response = await apiClient.post<any>(`/challenges/${id}/start`);
    return response.data;
  },

  completeQuizInChallenge: async (
    challengeId: string,
    quizId: string,
    attemptData: { score: number; totalQuestions: number; attemptId: string }
  ): Promise<any> => {
    const response = await apiClient.post<any>(
      `/challenges/${challengeId}/quiz/${quizId}/complete`,
      attemptData
    );
    return response.data;
  },

  getChallengeProgress: async (id: string): Promise<any> => {
    const response = await apiClient.get<any>(`/challenges/${id}/progress`);
    return response.data;
  },

  getChallengeLeaderboard: async (id: string): Promise<any> => {
    const response = await apiClient.get<any>(`/challenges/${id}/leaderboard`);
    return response.data;
  },
};
