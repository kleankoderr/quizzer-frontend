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
    studyPacks: number;
    documents: number;
  };
  engagement: {
    totalAttempts: number;
    attemptsLast7Days: number;
  };
  subscriptions?: {
    total: number;
    active: number;
    canceled: number;
    mrr: number;
  };
  quotas?: {
    totalStorageUsedGB: number;
    premiumUsers: number;
    freeUsers: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  plan: 'FREE' | 'PREMIUM';
  isActive: boolean;
  schoolName?: string;
  grade?: string;
  createdAt: string;
  subscription?: {
    status: string;
    currentPeriodEnd: Date;
    plan: {
      name: string;
    };
  };
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
  isPremium?: boolean;
  page?: number;
  limit?: number;
}

export interface SubscriptionStats {
  // User breakdown
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  premiumPercentage: number;

  // Subscription counts
  total: number;
  active: number;
  canceled: number;
  newLast30Days: number;

  // Revenue metrics
  mrr: number;
  totalRevenue: number;
  revenueByPlan: Array<{
    planName: string;
    revenue: number;
    count: number;
  }>;

  // Performance metrics
  growthRate: number;
  churnRate: number;

  // Chart data
  growthData: Array<{
    date: string;
    count: number;
  }>;
}

export interface QuotaStats {
  totalQuizzesGenerated: number;
  totalFlashcardsGenerated: number;
  totalLearningGuidesGenerated: number;
  totalExplanationsGenerated: number;
  totalFileUploads: number;
  totalStorageUsedMB: number;
  totalStorageUsedGB: number;
  premiumUsers: number;
  freeUsers: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  quotas: Record<string, any>;
  isActive: boolean;
  subscriberCount?: number;
  createdAt: string;
  updatedAt: string;
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

  /** List all flashcard sets in the application (admin view) */
  getAllContentFlashcards: async (filter: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get('/admin/content/flashcards', { params: filter });
    return response.data;
  },

  deleteFlashcardSet: async (flashcardSetId: string) => {
    const response = await api.delete(`/admin/flashcard-set/${flashcardSetId}`);
    return response.data;
  },

  getAdminQuizzes: async (filter: any) => {
    const response = await api.get('/admin/quiz', { params: filter });
    return response.data;
  },

  getReportedContent: async () => {
    const response = await api.get('/admin/content/reports');
    return response.data;
  },

  getAdminQuizDetails: async (id: string) => {
    const response = await api.get(`/admin/quiz/${id}`);
    return response.data;
  },

  updateAdminQuiz: async (id: string, data: any) => {
    const response = await api.patch(`/admin/quiz/${id}`, data);
    return response.data;
  },

  deleteQuestions: async (quizId: string, questionIds: string[]) => {
    const response = await api.delete(`/admin/quiz/${quizId}/questions`, {
      data: { questionIds },
    });
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

  generateQuiz: async (
    request: any,
    files?: File[]
  ): Promise<{ jobId: string; status: string }> => {
    const formData = new FormData();

    // Add files if provided
    if (files && files.length > 0) {
      for (const file of files) {
        formData.append('files', file);
      }
    }

    // Add all other fields from the request
    Object.entries(request).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => formData.append(`${key}[]`, String(v)));
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await api.post<{ jobId: string; status: string }>(
      '/admin/quiz',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  getAdminStudyMaterials: async (params?: {
    page?: number;
    limit?: number;
    scope?: string;
    schoolId?: string;
    search?: string;
  }) => {
    const response = await api.get('/admin/study-material', { params });
    return response.data;
  },

  getAdminStudyMaterialDetail: async (id: string) => {
    const response = await api.get(`/admin/study-material/${id}`);
    return response.data;
  },

  /** Queue admin study material generation (same UI as user). Returns jobId for progress tracking. */
  generateAdminStudyMaterial: async (
    data: {
      topic?: string;
      content?: string;
      title?: string;
      selectedFileIds?: string[];
      scope: 'GLOBAL' | 'SCHOOL';
      schoolId?: string;
      isActive?: boolean;
    },
    files?: File[]
  ): Promise<{ jobId: string; status: string }> => {
    const formData = new FormData();
    if (data.topic) formData.append('topic', data.topic);
    if (data.content) formData.append('content', data.content);
    if (data.title) formData.append('title', data.title);
    if (data.scope) formData.append('scope', data.scope);
    if (data.schoolId) formData.append('schoolId', data.schoolId);
    formData.append('isActive', String(data.isActive !== false));
    if (data.selectedFileIds?.length) {
      data.selectedFileIds.forEach((id) => formData.append('selectedFileIds[]', id));
    }
    if (files?.length) {
      files.forEach((file) => formData.append('files', file));
    }
    const response = await api.post<{ jobId: string; status: string }>(
      '/admin/study-material',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  updateAdminStudyMaterial: async (
    id: string,
    data: {
      title?: string;
      topic?: string;
      content?: string;
      description?: string;
      scope?: 'GLOBAL' | 'SCHOOL';
      schoolId?: string;
      isActive?: boolean;
    }
  ) => {
    const response = await api.patch(`/admin/study-material/${id}`, data);
    return response.data;
  },

  deleteAdminStudyMaterial: async (id: string) => {
    const response = await api.delete(`/admin/study-material/${id}`);
    return response.data;
  },

  getAdminStudyPacks: async (params?: {
    page?: number;
    limit?: number;
    scope?: string;
    schoolId?: string;
    search?: string;
  }) => {
    const response = await api.get('/admin/study-pack', { params });
    return response.data;
  },

  getAdminStudyPack: async (id: string) => {
    const response = await api.get(`/admin/study-pack/${id}`);
    return response.data;
  },

  createAdminStudyPack: async (data: {
    title: string;
    description?: string;
    scope: 'GLOBAL' | 'SCHOOL';
    schoolId?: string;
    isActive?: boolean;
  }) => {
    const response = await api.post('/admin/study-pack', data);
    return response.data;
  },

  updateAdminStudyPack: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      scope?: 'GLOBAL' | 'SCHOOL';
      schoolId?: string;
      isActive?: boolean;
    }
  ) => {
    const response = await api.patch(`/admin/study-pack/${id}`, data);
    return response.data;
  },

  deleteAdminStudyPack: async (id: string) => {
    const response = await api.delete(`/admin/study-pack/${id}`);
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
    const response = await api.get('/platform-settings');
    return response.data;
  },

  updateSettings: async (data: any) => {
    const response = await api.patch('/platform-settings', data);
    return response.data;
  },

  /** List only admin-created flashcard sets */
  getAdminFlashcards: async (params?: {
    page?: number;
    limit?: number;
    scope?: string;
    schoolId?: string;
    search?: string;
  }) => {
    const response = await api.get('/admin/flashcard', { params });
    return response.data;
  },

  getAdminFlashcard: async (id: string) => {
    const response = await api.get(`/admin/flashcard/${id}`);
    return response.data;
  },

  createAdminFlashcard: async (
    data: {
      topic?: string;
      content?: string;
      contentId?: string;
      numberOfCards: number;
      scope: 'GLOBAL' | 'SCHOOL';
      schoolId?: string;
      isActive?: boolean;
    },
    files?: File[]
  ): Promise<{ jobId: string; status: string }> => {
    const formData = new FormData();
    if (data.topic) formData.append('topic', data.topic);
    if (data.content) formData.append('content', data.content);
    if (data.contentId) formData.append('contentId', data.contentId);
    formData.append('numberOfCards', String(data.numberOfCards));
    formData.append('scope', data.scope);
    if (data.schoolId) formData.append('schoolId', data.schoolId);
    formData.append('isActive', String(data.isActive !== false));
    if (files?.length) {
      files.forEach((f) => formData.append('files', f));
    }
    const response = await api.post<{ jobId: string; status: string }>(
      '/admin/flashcard',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  deleteAdminFlashcard: async (id: string) => {
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

  // Subscription Management Methods

  getSubscriptionStats: async (): Promise<SubscriptionStats> => {
    const response = await api.get('/admin/subscription-stats');
    return response.data;
  },

  getQuotaStats: async (): Promise<QuotaStats> => {
    const response = await api.get('/admin/quota-stats');
    return response.data;
  },

  getAllSubscriptions: async (filter?: any) => {
    const response = await api.get('/admin/subscriptions', { params: filter });
    return response.data;
  },

  getSubscriptionPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await api.get('/admin/subscription-plans');
    return response.data;
  },

  createSubscriptionPlan: async (data: any): Promise<SubscriptionPlan> => {
    const response = await api.post('/admin/subscription-plans', data);
    return response.data;
  },

  updateSubscriptionPlan: async (
    id: string,
    data: any
  ): Promise<SubscriptionPlan> => {
    const response = await api.patch(`/admin/subscription-plans/${id}`, data);
    return response.data;
  },

  deleteSubscriptionPlan: async (id: string) => {
    const response = await api.delete(`/admin/subscription-plans/${id}`);
    return response.data;
  },

  getUserQuota: async (userId: string) => {
    const response = await api.get(`/admin/users/${userId}/quota`);
    return response.data;
  },

  getPaymentFailures: async (page = 1, limit = 50) => {
    const response = await api.get('/subscription/admin/payment-failures', {
      params: { page, limit },
    });
    return response.data;
  },

  getPaymentStats: async () => {
    const response = await api.get('/subscription/admin/payment-stats');
    return response.data;
  },
};
