import { apiClient } from './api';

export interface WeakArea {
  id: string;
  userId: string;
  topic: string;
  concept: string;
  errorCount: number;
  lastErrorAt: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeakAreaStatsGroup {
  topic: string;
  count: number;
  totalErrors: number;
  concepts: string[];
}

export interface WeakAreaStats {
  totalWeakAreas: number;
  totalErrors: number;
  byTopic: WeakAreaStatsGroup[];
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  questions: any[];
}

class WeakAreaService {
  /**
   * Get unresolved weak areas for the current user
   */
  async getWeakAreas(): Promise<WeakArea[]> {
    const response = await apiClient.get('/weak-areas');
    return response.data;
  }

  /**
   * Get resolved weak areas for the current user
   */
  async getResolvedWeakAreas(): Promise<WeakArea[]> {
    const response = await apiClient.get('/weak-areas/resolved');
    return response.data;
  }

  /**
   * Mark a weak area as resolved
   */
  async resolveWeakArea(id: string): Promise<WeakArea> {
    const response = await apiClient.post(`/weak-areas/${id}/resolve`);
    return response.data;
  }

  /**
   * Get weak area statistics grouped by topic
   */
  async getWeakAreaStats(): Promise<WeakAreaStats> {
    const response = await apiClient.get('/weak-areas/stats');
    return response.data;
  }

  /**
   * Generate smart practice quiz for a specific weak area (Premium only)
   */
  async generatePracticeQuiz(id: string): Promise<Quiz> {
    const response = await apiClient.post(`/weak-areas/${id}/practice`);
    return response.data;
  }
}

export const weakAreaService = new WeakAreaService();
