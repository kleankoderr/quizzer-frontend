import { apiClient /*, setCsrfToken */ } from "./api";
import { AUTH_ENDPOINTS } from "../config/api";
import type { User } from "../types";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { auth, googleProvider } from "../config/firebase.config";

export const authService = {
  // Fetch CSRF token
  // fetchCsrfToken: async (): Promise<void> => {
  //   try {
  //     const response = await apiClient.get<{ csrfToken: string }>(
  //       "/auth/csrf-token"
  //     );
  //     setCsrfToken(response.data.csrfToken);
  //   } catch (error) {}
  // },

  // Email/password login
  login: async (email: string, password: string): Promise<User> => {
    const response = await apiClient.post<{ user: User }>(
      AUTH_ENDPOINTS.LOGIN,
      {
        email,
        password,
      }
    );
    return response.data.user;
  },

  // Email/password signup
  signup: async (
    email: string,
    password: string,
    name: string
  ): Promise<User> => {
    const response = await apiClient.post<{ user: User }>(
      AUTH_ENDPOINTS.SIGNUP,
      {
        email,
        password,
        name,
      }
    );
    return response.data.user;
  },

  // Google Sign-In (Popup)
  googleSignIn: async (): Promise<User> => {
    try {
      // Sign in with Google using Firebase
      const result = await signInWithPopup(auth, googleProvider);

      // Get the ID token
      const idToken = await result.user.getIdToken();

      // Send the token to backend for verification
      const response = await apiClient.post<{ user: User }>(
        AUTH_ENDPOINTS.GOOGLE_LOGIN,
        { idToken }
      );

      return response.data.user;
    } catch (error: any) {
      throw error;
    }
  },

  // Google Sign-In (Redirect) - Better for mobile
  initiateGoogleRedirect: async (): Promise<void> => {
    await signInWithRedirect(auth, googleProvider);
  },

  // Handle Redirect Result
  handleGoogleRedirect: async (): Promise<User | null> => {
    try {
      const result = await getRedirectResult(auth);
      if (!result) return null;

      const idToken = await result.user.getIdToken();

      const response = await apiClient.post<{ user: User }>(
        AUTH_ENDPOINTS.GOOGLE_LOGIN,
        { idToken }
      );

      return response.data.user;
    } catch (error: any) {
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>(AUTH_ENDPOINTS.ME);
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.post(AUTH_ENDPOINTS.LOGOUT);
    localStorage.removeItem("user");
  },

  // Save auth data (only user info now)
  saveAuthData: (user: User) => {
    localStorage.removeItem("accessToken"); // Ensure token is removed if it exists
    localStorage.setItem("user", JSON.stringify(user));
  },

  // Get stored user
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },
};
