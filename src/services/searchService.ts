import { apiClient } from './api';

export interface SearchResult {
  id: string;
  title: string;
  type: 'quiz' | 'flashcard' | 'content';
  metadata?: string;
  url: string;
}

export const searchService = {
  search: async (query: string): Promise<SearchResult[]> => {
    if (!query || query.trim().length === 0) return [];
    const response = await apiClient.get<SearchResult[]>(
      `/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },
};
