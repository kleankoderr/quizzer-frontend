import React, { createContext, useContext, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { sseService } from '../services/SSEService';
import { authService } from '../services/auth.service';

interface SSEContextType {
  service: typeof sseService;
}

const SSEContext = createContext<SSEContextType | undefined>(undefined);

export const SSEProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      const token = authService.getToken();
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const url = `${baseUrl}/sse/stream`;

      sseService.connect(url, token || undefined);
    } else {
      sseService.disconnect();
    }

    return () => {
      sseService.disconnect();
    };
  }, [user?.id]);

  const value = useMemo(() => ({ service: sseService }), []);

  return <SSEContext.Provider value={value}>{children}</SSEContext.Provider>;
};

export const useSSEContext = (): SSEContextType => {
  const context = useContext(SSEContext);
  if (!context) {
    throw new Error('useSSEContext must be used within an SSEProvider');
  }
  return context;
};
