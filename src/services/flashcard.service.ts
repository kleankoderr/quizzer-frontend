import { apiClient } from './api';
import { FLASHCARD_ENDPOINTS } from '../config/api';
import type { FlashcardSet, FlashcardGenerateRequest } from '../types';

export const flashcardService = {
  // Generate flashcards
  generate: async (
    request: FlashcardGenerateRequest,
    files?: File[]
  ): Promise<{ jobId: string; status: string }> => {
    const formData = new FormData();

    // Add files if provided
    if (files && files.length > 0) {
      for (const file of files) {
        formData.append('files', file);
      }
    }

    // Add other fields
    if (request.topic) formData.append('topic', request.topic);
    if (request.content) formData.append('content', request.content);
    if (request.contentId) formData.append('contentId', request.contentId);
    if (request.selectedFileIds && request.selectedFileIds.length > 0) {
      for (const id of request.selectedFileIds) {
        formData.append('selectedFileIds[]', id);
      }
    }
    if (request.studyPackId) {
      formData.append('studyPackId', request.studyPackId);
    }
    formData.append('numberOfCards', request.numberOfCards.toString());

    const response = await apiClient.post<{ jobId: string; status: string }>(
      FLASHCARD_ENDPOINTS.GENERATE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Get all flashcard sets
  getAll: async (): Promise<FlashcardSet[]> => {
    const response = await apiClient.get<FlashcardSet[]>(
      FLASHCARD_ENDPOINTS.GET_ALL
    );
    return response.data;
  },

  // Get flashcard set by ID
  getById: async (id: string): Promise<FlashcardSet> => {
    const response = await apiClient.get<FlashcardSet>(
      FLASHCARD_ENDPOINTS.GET_BY_ID(id)
    );
    return response.data;
  },

  // Record flashcard study session
  recordSession: async (
    id: string,
    cardResponses: Array<{
      cardIndex: number;
      response: 'know' | 'dont-know' | 'skipped';
    }>
  ): Promise<any> => {
    const response = await apiClient.post(
      FLASHCARD_ENDPOINTS.RECORD_SESSION(id),
      { cardResponses }
    );
    return response.data;
  },

  // Delete flashcard set
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/flashcards/${id}`);
  },
};
