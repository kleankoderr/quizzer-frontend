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
    const response = await api.get('/platform-settings');
    return response.data;
  },

  updateSettings: async (data: any) => {
    const response = await api.patch('/platform-settings', data);
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
