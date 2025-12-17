import { apiClient } from './api';
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

    // Save user data to localStorage (token stored in HttpOnly cookie)
    const { user } = response.data;
    authService.saveAuthData(user);

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

    // Save user data to localStorage (token stored in HttpOnly cookie)
    const { user } = response.data;
    authService.saveAuthData(user);

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

    // Save user data to localStorage (token stored in HttpOnly cookie)
    const { user } = response.data;
    authService.saveAuthData(user);

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
  },

  // Save auth data (user info only, token in HttpOnly cookie)
  saveAuthData: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Get stored user
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};
