import { apiClient } from './api';
import type { Quiz, FlashcardSet } from '../types';

export interface StudyInsights {
  stats: {
    totalTopics: number;
    masteryCount: number;
    learningCount: number;
    dueForReview: number;
  };
  retentionDistribution: {
    LEARNING: number;
    REINFORCEMENT: number;
    RECALL: number;
    MASTERY: number;
  };
  suggestions: {
    type: 'review' | 'practice';
    topic: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    contentId?: string;
    quizId?: string;
    flashcardSetId?: string;
  }[];
}

export interface UpcomingReview {
  date: string;
  count: number;
}

export interface DueForReviewResponse {
  dueFlashcards: FlashcardSet[];
  dueQuizzes: Quiz[];
  upcomingReviews: UpcomingReview[];
  totalDue: number;
  overdueCount: number;
  stats: {
    totalTopics: number;
    avgRetentionStrength: number;
  };
}

export const studyService = {
  async getInsights(): Promise<StudyInsights> {
    const response = await apiClient.get('/study/insights');
    return response.data;
  },

  async getDueForReview(): Promise<DueForReviewResponse> {
    const response = await apiClient.get('/study/due-for-review');
    return response.data;
  },
};
