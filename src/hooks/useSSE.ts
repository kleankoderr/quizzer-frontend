import {useCallback, useEffect, useSyncExternalStore} from "react";
import {useSSEContext} from "../contexts/SSEContext";
import type {AppEvent} from "../types/events";

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
export const useSSEEvent = (
    eventType: string,
    handler: EventHandler
): void => {
    const { service } = useSSEContext();

    useEffect(() => {
        return service.addEventListener(eventType, handler);
    }, [service, eventType, handler]);
};