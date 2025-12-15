import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { useSSEContext } from '../contexts/SSEContext';
import type { AppEvent } from '../types/events';

interface SSEState {
  isConnected: boolean;
  lastEvent: AppEvent | null;
}

type EventHandler = (event: AppEvent) => void;

export const useSSE = (): SSEState => {
  const { service } = useSSEContext();

  return useSyncExternalStore(
    useCallback((callback) => service.subscribeToStore(callback), [service]),
    useCallback(() => service.getSnapshot(), [service])
  );
};

/**
 * Hook to listen to specific event types
 */
export const useSSEEvent = (eventType: string, handler: EventHandler): void => {
  const { service } = useSSEContext();
  
  // Use ref to store the latest handler without triggering re-subscriptions
  const handlerRef = useRef(handler);
  
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    // Stable wrapper that always calls the latest handler
    const stableHandler = (event: AppEvent) => {
      handlerRef.current(event);
    };
    
    return service.addEventListener(eventType, stableHandler);
  }, [service, eventType]);
};