import { apiClient } from './api';

export interface DailyQuote {
  text: string;
  author: string;
}

export const quoteService = {
  getDailyQuote: async (): Promise<DailyQuote> => {
    const response = await apiClient.get<DailyQuote>('/quotes/daily');
    return response.data;
  },
};
