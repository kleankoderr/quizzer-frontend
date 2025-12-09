import { apiClient } from './api';

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

export const studyService = {
  async getInsights(): Promise<StudyInsights> {
    const response = await apiClient.get('/study/insights');
    return response.data;
  },
};
