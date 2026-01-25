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
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<StudyPack>> => {
    const response = await apiClient.get<PaginatedResponse<StudyPack>>(
      '/study-pack',
      {
        params: { page, limit, search },
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
    >(`/study-pack/${id}`);
    return response.data;
  },

  create: async (data: CreateStudyPackRequest): Promise<StudyPack> => {
    const response = await apiClient.post<StudyPack>('/study-pack', data);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateStudyPackRequest
  ): Promise<StudyPack> => {
    const response = await apiClient.patch<StudyPack>(
      `/study-pack/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/study-pack/${id}`);
  },

  moveItem: async (id: string, data: MoveItemRequest): Promise<any> => {
    const response = await apiClient.post(`/study-pack/${id}/move`, data);
    return response.data;
  },

  removeItem: async (id: string, data: MoveItemRequest): Promise<void> => {
    await apiClient.post(`/study-pack/${id}/remove-item`, data);
  },
};
