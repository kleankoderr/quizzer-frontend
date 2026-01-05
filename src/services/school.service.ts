import { apiClient } from './api';

export interface School {
  id: string;
  name: string;
}

export const schoolService = {
  getTopSchools: async (): Promise<School[]> => {
    const response = await apiClient.get<School[]>('/schools');
    return response.data;
  },

  searchSchools: async (query: string): Promise<School[]> => {
    if (!query || query.length < 2) return [];
    const response = await apiClient.get<School[]>(
      `/schools/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },
};
