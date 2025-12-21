import React, {
  createContext,
  useContext,
  useSyncExternalStore,
  useMemo,
  useCallback,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '../types';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
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
    listeners.forEach((listener) => listener());
  },
};

// Initialize auth state from storage
const initializeAuth = async () => {
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
  const queryClient = useQueryClient();
  
  const state = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot
  );

  React.useEffect(() => {
    const syncUser = async () => {
      if (state.user) {
        try {
          const freshUser = await authService.getCurrentUser();
          authStore.setState({ user: freshUser });
          authService.saveAuthData(freshUser);
        } catch (_error) {
         console.error('Failed to refresh user', _error);
        }
      }
    };
    syncUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback((userData: User) => {
    authStore.setState({ user: userData });
    authService.saveAuthData(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (_error) {
      console.error('Logout failed', _error);
    } finally {
      // Clear all React Query cache to prevent stale data
      queryClient.clear();
      authStore.setState({ user: null });
    }
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authService.getCurrentUser();
      authStore.setState({ user: freshUser });
      authService.saveAuthData(freshUser);
    } catch (_error) {
      console.error('Failed to refresh user', _error);
    }
  }, []);

  const value = useMemo(
    () => ({
      user: state.user,
      loading: state.loading,
      login,
      logout,
      isAuthenticated: !!state.user,
      refreshUser,
    }),
    [state.user, state.loading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
