import React, { createContext, useContext, useSyncExternalStore, useMemo, useCallback } from 'react';
import type { User } from '../types';
import { authService } from '../services/auth.service';
import { analytics } from '../services/analytics.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// External store for auth state
let authState = {
  user: null as User | null,
  loading: true,
};

const listeners = new Set<() => void>();

const authStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return authState;
  },
  setState(newState: Partial<typeof authState>) {
    authState = { ...authState, ...newState };
    listeners.forEach(listener => listener());
  },
};

// Initialize auth state from storage and fetch CSRF token
const initializeAuth = async () => {
  await authService.fetchCsrfToken();
  const storedUser = authService.getStoredUser();
  if (storedUser) {
    authStore.setState({ user: storedUser, loading: false });
  } else {
    authStore.setState({ loading: false });
  }
};

initializeAuth();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const state = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot
  );

  const login = useCallback((userData: User) => {
    authStore.setState({ user: userData });
    authService.saveAuthData(userData);
    analytics.identify(userData.id);
    analytics.trackAuthLogin('email', true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {

    }
    authStore.setState({ user: null });
    analytics.reset();
  }, []);

  const value = useMemo(() => ({
    user: state.user,
    loading: state.loading,
    login,
    logout,
    isAuthenticated: !!state.user,
  }), [state.user, state.loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
