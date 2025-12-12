import { apiClient } from './api';
import type {
  StudyPack,
  CreateStudyPackRequest,
  UpdateStudyPackRequest,
  MoveItemRequest,
  PaginatedResponse,
} from '../types';

export const studyPackService = {
  getAll: async (
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<StudyPack>> => {
    const response = await apiClient.get<PaginatedResponse<StudyPack>>(
      '/study-packs',
      {
        params: { page, limit },
      }
    );
    return response.data;
  },

  getById: async (
    id: string
  ): Promise<
    StudyPack & {
      quizzes: any[];
      flashcardSets: any[];
      contents: any[];
      userDocuments: any[];
    }
  > => {
    const response = await apiClient.get<
      StudyPack & {
        quizzes: any[];
        flashcardSets: any[];
        contents: any[];
        userDocuments: any[];
      }
    >(`/study-packs/${id}`);
    return response.data;
  },

  create: async (data: CreateStudyPackRequest): Promise<StudyPack> => {
    const response = await apiClient.post<StudyPack>('/study-packs', data);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateStudyPackRequest
  ): Promise<StudyPack> => {
    const response = await apiClient.patch<StudyPack>(
      `/study-packs/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/study-packs/${id}`);
  },

  moveItem: async (id: string, data: MoveItemRequest): Promise<void> => {
    await apiClient.post(`/study-packs/${id}/move`, data);
  },

  removeItem: async (id: string, data: MoveItemRequest): Promise<void> => {
    await apiClient.post(`/study-packs/${id}/remove-item`, data);
  },
};
