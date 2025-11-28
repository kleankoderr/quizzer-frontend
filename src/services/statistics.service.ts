import { apiClient } from "./api";

export interface StatisticsOverview {
  totalAttempts: number;
  averageAccuracy: number;
  totalTimeSpent: number; // in minutes
  currentStreak: number;
  quizAttempts: number;
  flashcardAttempts: number;
}

export interface Attempt {
  id: string;
  type: "quiz" | "flashcard";
  score?: number;
  totalQuestions?: number;
  completedAt: string;
  quiz?: {
    id: string;
    title: string;
    topic: string;
  };
  flashcardSet?: {
    id: string;
    title: string;
    topic: string;
  };
}

export interface PerformanceByTopic {
  topic: string;
  attempts: number;
  averageScore: number;
  accuracy: number;
}

export interface ActivityData {
  date: string;
  count: number;
}

export const statisticsService = {
  async getOverview(): Promise<StatisticsOverview> {
    const response = await apiClient.get("/statistics/overview");
    return response.data;
  },

  async getAttempts(filters?: {
    type?: "quiz" | "flashcard";
    startDate?: string;
    endDate?: string;
    limit?: number;
    page?: number;
  }): Promise<{
    attempts: Attempt[];
    total: number;
    totalPages: number;
    page: number;
  }> {
    const response = await apiClient.get("/statistics/attempts", {
      params: filters,
    });
    return response.data;
  },

  async getPerformanceByTopic(): Promise<PerformanceByTopic[]> {
    const response = await apiClient.get("/statistics/performance");
    return response.data;
  },

  async getActivityHeatmap(year?: number): Promise<ActivityData[]> {
    const params = year ? { year } : {};
    const response = await apiClient.get("/statistics/activity", { params });
    return response.data;
  },
};
