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

  // Detect if device is mobile
  isMobileDevice: (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  },

  // Google Sign-In - Uses popup on desktop, redirect on mobile
  googleSignIn: async (): Promise<User | null> => {
    try {
      const isMobile = authService.isMobileDevice();

      if (isMobile) {
        // On mobile, initiate redirect flow
        await signInWithRedirect(auth, googleProvider);
        // Redirect happens, return null as we'll handle result on page load
        return null;
      } else {
        // On desktop, use popup
        const result = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken();

        const response = await apiClient.post<{ user: User }>(
          AUTH_ENDPOINTS.GOOGLE_LOGIN,
          { idToken }
        );

        return response.data.user;
      }
    } catch (error: any) {
      // If popup was blocked, fall back to redirect
      if (error.code === "auth/popup-blocked") {
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
      throw error;
    }
  },

  // Handle Redirect Result - Call this on page load
  handleGoogleRedirect: async (): Promise<User | null> => {
    try {
      const result = await getRedirectResult(auth);

      // No redirect result means user didn't come from OAuth redirect
      if (!result || !result.user) {
        return null;
      }

      const idToken = await result.user.getIdToken();

      const response = await apiClient.post<{ user: User }>(
        AUTH_ENDPOINTS.GOOGLE_LOGIN,
        { idToken }
      );

      return response.data.user;
    } catch (error: any) {
      // Only throw if it's not a "no redirect result" scenario
      if (error.code && error.code !== "auth/no-redirect-result") {
        throw error;
      }
      return null;
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
