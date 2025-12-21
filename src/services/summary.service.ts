import { apiClient } from './api';

/**
 * Summary interface representing a study material summary
 */
export interface Summary {
  id: string;
  shortCode: string;
  studyMaterialId: string;
  content: string;
  viewCount: number;
  isPublic: boolean;
  generatedAt: string;
  studyMaterial: {
    id: string;
    title: string;
    topic: string;
    user: {
      id: string;
      name: string;
      avatar: string | null;
    };
  };
  reactionCounts: {
    like: number;
    love: number;
    helpful: number;
    bookmark: number;
  };
  userReactions?: string[]; // If authenticated
}

/**
 * Reaction type for summary reactions
 */
export type ReactionType = 'like' | 'love' | 'helpful' | 'bookmark';

/**
 * Summary Service
 * Handles all summary-related API calls using cookie-based authentication
 */
export const summaryService = {
  /**
   * Generate a summary for a study material
   * Queues a background job to generate the summary
   * @param studyMaterialId - The ID of the study material to generate a summary for
   * @returns Promise<{ jobId: string }> Job ID for tracking generation progress
   */
  generateSummary: async (
    studyMaterialId: string
  ): Promise<{ jobId: string }> => {
    const response = await apiClient.post<{ jobId: string }>(
      `/summary/${studyMaterialId}/generate`
    );
    return response.data;
  },

  /**
   * Get the status of a summary generation job
   * @param jobId - The ID of the job to check
   * @returns Promise<any> Job status details
   */
  getGenerationStatus: async (jobId: string): Promise<any> => {
    const response = await apiClient.get<any>(`/summary/job/${jobId}`);
    return response.data;
  },

  /**
   * Get a summary by its short code
   * Public endpoint - accessible without authentication
   * @param shortCode - The short code of the summary
   * @returns Promise<Summary> The summary details
   */
  getSummaryByShortCode: async (shortCode: string): Promise<Summary> => {
    const response = await apiClient.get<Summary>(`/summary/${shortCode}`);
    return response.data;
  },

  /**
   * Toggle the visibility of a summary (public/private)
   * @param summaryId - The ID of the summary to update
   * @param isPublic - Whether the summary should be public
   * @returns Promise<Summary> The updated summary
   */
  toggleVisibility: async (
    summaryId: string,
    isPublic: boolean
  ): Promise<Summary> => {
    const response = await apiClient.patch<Summary>(
      `/summary/${summaryId}/visibility`,
      { isPublic }
    );
    return response.data;
  },

  /**
   * Track a view on a summary
   * Increments the view count for the summary
   * @param shortCode - The short code of the summary
   * @returns Promise<void>
   */
  trackView: async (shortCode: string): Promise<void> => {
    await apiClient.post(`/summary/${shortCode}/view`);
  },

  /**
   * Add a reaction to a summary
   * @param shortCode - The short code of the summary
   * @param type - The type of reaction (like, love, helpful, bookmark)
   * @returns Promise<void>
   */
  addReaction: async (shortCode: string, type: ReactionType): Promise<void> => {
    await apiClient.post(`/summary/${shortCode}/react`, { type });
  },

  /**
   * Remove a reaction from a summary
   * @param shortCode - The short code of the summary
   * @param type - The type of reaction to remove
   * @returns Promise<void>
   */
  removeReaction: async (
    shortCode: string,
    type: ReactionType
  ): Promise<void> => {
    await apiClient.delete(`/summary/${shortCode}/react`, {
      data: { type },
    });
  },

  /**
   * Delete a summary
   * Only the owner can delete their summaries
   * @param summaryId - The ID of the summary to delete
   * @returns Promise<void>
   */
  deleteSummary: async (summaryId: string): Promise<void> => {
    await apiClient.delete(`/summary/${summaryId}`);
  },

  /**
   * Get all summaries for the current user
   * @returns Promise<Summary[]> List of summaries
   */
  getUserSummaries: async (): Promise<Summary[]> => {
    const response = await apiClient.get<Summary[]>('/summary');
    return response.data;
  },
};
