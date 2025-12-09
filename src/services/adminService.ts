import { apiClient as api } from './api';

export interface SystemStats {
  users: {
    total: number;
    active: number;
    newLast7Days: number;
  };
  content: {
    quizzes: number;
    flashcards: number;
    studyMaterials: number;
  };
  engagement: {
    totalAttempts: number;
    attemptsLast7Days: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  schoolName?: string;
  grade?: string;
  createdAt: string;
  _count?: {
    quizzes: number;
    flashcardSets: number;
    attempts: number;
  };
}

export interface UserFilter {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const adminService = {
  getSystemStats: async (): Promise<SystemStats> => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getUsers: async (filter: UserFilter) => {
    const response = await api.get('/admin/users', { params: filter });
    return response.data;
  },

  getUserDetails: async (userId: string) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  getUserContent: async (userId: string, filter?: any) => {
    const response = await api.get(`/admin/users/${userId}/content`, {
      params: filter,
    });
    return response.data;
  },

  updateUserStatus: async (userId: string, isActive: boolean) => {
    const response = await api.patch(`/admin/users/${userId}/status`, {
      isActive,
    });
    return response.data;
  },

  updateUserRole: async (userId: string, role: string) => {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  getAllContent: async (filter: any) => {
    const response = await api.get('/admin/content', { params: filter });
    return response.data;
  },

  getReportedContent: async () => {
    const response = await api.get('/admin/content/reports');
    return response.data;
  },

  moderateContent: async (
    id: string,
    action: 'DELETE' | 'HIDE' | 'IGNORE',
    reason?: string
  ) => {
    const response = await api.post(`/admin/content/${id}/moderate`, {
      action,
      reason,
    });
    return response.data;
  },

  deleteContent: async (id: string) => {
    const response = await api.delete(`/admin/content/${id}`);
    return response.data;
  },

  deleteQuiz: async (id: string) => {
    const response = await api.delete(`/admin/quiz/${id}`);
    return response.data;
  },

  getSchools: async () => {
    const response = await api.get('/admin/schools');
    return response.data;
  },

  createSchool: async (data: any) => {
    const response = await api.post('/admin/schools', data);
    return response.data;
  },

  updateSchool: async (id: string, data: any) => {
    const response = await api.patch(`/admin/schools/${id}`, data);
    return response.data;
  },

  getAiAnalytics: async () => {
    const response = await api.get('/admin/ai-analytics');
    return response.data;
  },

  getSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  updateSettings: async (data: any) => {
    const response = await api.patch('/admin/settings', data);
    return response.data;
  },

  deleteFlashcard: async (id: string) => {
    const response = await api.delete(`/admin/flashcard/${id}`);
    return response.data;
  },

  createChallenge: async (data: any) => {
    const response = await api.post('/admin/challenges', data);
    return response.data;
  },

  deleteChallenge: async (id: string) => {
    const response = await api.delete(`/admin/challenges/${id}`);
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/admin/analytics');
    return response.data;
  },

  getAllChallenges: async (filter?: any) => {
    const response = await api.get('/admin/challenges', { params: filter });
    return response.data;
  },

  getAllFlashcards: async (filter?: any) => {
    const response = await api.get('/admin/flashcards', { params: filter });
    return response.data;
  },

  generateDailyChallenges: async () => {
    const response = await api.post('/admin/challenges/generate/daily');
    return response.data;
  },

  generateWeeklyChallenges: async () => {
    const response = await api.post('/admin/challenges/generate/weekly');
    return response.data;
  },

  generateMonthlyChallenges: async () => {
    const response = await api.post('/admin/challenges/generate/monthly');
    return response.data;
  },

  generateHotChallenges: async () => {
    const response = await api.post('/admin/challenges/generate/hot');
    return response.data;
  },
};
