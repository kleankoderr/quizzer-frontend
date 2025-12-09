import { apiClient /*, setCsrfToken */ } from './api';
import { AUTH_ENDPOINTS } from '../config/api';
import type { User } from '../types';

export const authService = {
  // Email/password login
  login: async (email: string, password: string): Promise<User> => {
    const response = await apiClient.post<{
      user: User;
      accessToken: string;
    }>(AUTH_ENDPOINTS.LOGIN, {
      email,
      password,
    });

    // Save user data and token to localStorage for persistence
    const { user, accessToken } = response.data;
    authService.saveAuthData(user, accessToken);

    return user;
  },

  // Email/password signup
  signup: async (
    email: string,
    password: string,
    name: string
  ): Promise<User> => {
    const response = await apiClient.post<{
      user: User;
      accessToken: string;
    }>(AUTH_ENDPOINTS.SIGNUP, {
      email,
      password,
      name,
    });

    // Save user data and token to localStorage for persistence
    const { user, accessToken } = response.data;
    authService.saveAuthData(user, accessToken);

    return user;
  },

  // Detect if device is mobile
  isMobileDevice: (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  },

  // Google Sign-In - Accepts ID token from frontend component
  googleSignIn: async (idToken: string): Promise<User> => {
    const response = await apiClient.post<{ user: User; accessToken: string }>(
      AUTH_ENDPOINTS.GOOGLE_LOGIN,
      { idToken }
    );

    // Save user data and token to localStorage for persistence
    const { user, accessToken } = response.data;
    authService.saveAuthData(user, accessToken);

    return user;
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>(AUTH_ENDPOINTS.ME);
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.post(AUTH_ENDPOINTS.LOGOUT);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
  },

  // Save auth data (only user info now)
  // Save auth data
  saveAuthData: (user: User, accessToken?: string) => {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Get stored user
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },
};
