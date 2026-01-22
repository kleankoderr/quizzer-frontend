// API Configuration
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
).replace(/\/$/, '');

// Auth endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  SIGNUP: `${API_BASE_URL}/auth/signup`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  ME: `${API_BASE_URL}/auth/me`,
  GOOGLE_LOGIN: `${API_BASE_URL}/auth/google`,
  VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
  RESEND_OTP: `${API_BASE_URL}/auth/resend-otp`,
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh`,
};

// Quiz endpoints
export const QUIZ_ENDPOINTS = {
  GENERATE: `${API_BASE_URL}/quiz/generate`,
  GET_ALL: `${API_BASE_URL}/quiz`,
  GET_BY_ID: (id: string) => `${API_BASE_URL}/quiz/${id}`,
  SUBMIT: (id: string) => `${API_BASE_URL}/quiz/${id}/submit`,
};

// Flashcard endpoints
export const FLASHCARD_ENDPOINTS = {
  GENERATE: `${API_BASE_URL}/flashcards/generate`,
  GET_ALL: `${API_BASE_URL}/flashcards`,
  GET_BY_ID: (id: string) => `${API_BASE_URL}/flashcards/${id}`,
  RECORD_SESSION: (id: string) =>
    `${API_BASE_URL}/flashcards/${id}/record-session`,
};

// Streak endpoints
export const STREAK_ENDPOINTS = {
  GET_CURRENT: `${API_BASE_URL}/streak`,
  UPDATE: `${API_BASE_URL}/streak/update`,
};

// Leaderboard endpoints
export const LEADERBOARD_ENDPOINTS = {
  GLOBAL: `${API_BASE_URL}/leaderboard/global`,
  FRIENDS: `${API_BASE_URL}/leaderboard/friends`,
};

// Challenge endpoints
export const CHALLENGE_ENDPOINTS = {
  GET_ALL: `${API_BASE_URL}/challenges`,
  GET_DAILY: `${API_BASE_URL}/challenges/daily`,
  GET_HOT: `${API_BASE_URL}/challenges/hot`,
  GET_WEEKLY: `${API_BASE_URL}/challenges/weekly`,
  GET_MONTHLY: `${API_BASE_URL}/challenges/monthly`,
  GET_BY_ID: (id: string) => `${API_BASE_URL}/challenges/${id}`,
  COMPLETE: `${API_BASE_URL}/challenges/complete`,
  JOIN: `${API_BASE_URL}/challenges/join`,
  LEAVE: `${API_BASE_URL}/challenges/leave`,
};

// Recommendation endpoints
export const RECOMMENDATION_ENDPOINTS = {
  GET_ALL: `${API_BASE_URL}/recommendations`,
  DISMISS: (id: string) => `${API_BASE_URL}/recommendations/${id}/dismiss`,
};

// Coaching endpoints
export const COACHING_ENDPOINTS = {
  GET_TIPS: `${API_BASE_URL}/coaching/tips`,
};

// Attempts endpoints
export const ATTEMPTS_ENDPOINTS = {
  GET_ALL: `${API_BASE_URL}/attempts`,
  GET_BY_ID: (id: string) => `${API_BASE_URL}/attempts/${id}`,
};

// Subscription endpoints
export const SUBSCRIPTION_ENDPOINTS = {
  GET_PLANS: `${API_BASE_URL}/subscription/plans`,
  CHECKOUT: `${API_BASE_URL}/subscription/checkout`,
  VERIFY_PAYMENT: `${API_BASE_URL}/subscription/verify`,
  GET_MY_SUBSCRIPTION: `${API_BASE_URL}/subscription/me`,
  CANCEL_SUBSCRIPTION: `${API_BASE_URL}/subscription/cancel`,
  GET_CURRENT_PLAN: `${API_BASE_URL}/subscription/current-plan`,
};

// User endpoints
export const USER_ENDPOINTS = {
  GET_PROFILE: `${API_BASE_URL}/user/profile`,
  UPDATE_PROFILE: `${API_BASE_URL}/user/profile`,
  UPDATE_SETTINGS: `${API_BASE_URL}/user/settings`,
  CHANGE_PASSWORD: `${API_BASE_URL}/user/password`,
  DELETE_ACCOUNT: `${API_BASE_URL}/user/account`,
  GET_QUOTA: `${API_BASE_URL}/user/quota`,
};
