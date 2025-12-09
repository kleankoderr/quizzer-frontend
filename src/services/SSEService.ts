import type { AppEvent } from '../types/events';

type EventHandler = (event: AppEvent) => void;

interface SSESnapshot {
  isConnected: boolean;
  lastEvent: AppEvent | null;
}

export class SSEService {
  private static instance: SSEService;
  private eventSource: EventSource | null = null;
  private readonly listeners = new Map<string, Set<EventHandler>>();
  private url: string | null = null;
  private isConnected = false;
  private lastEvent: AppEvent | null = null;
  private readonly storeListeners = new Set<() => void>();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly baseReconnectDelay = 1000;

  private constructor() {}

  public static getInstance(): SSEService {
    if (!SSEService.instance) {
      SSEService.instance = new SSEService();
    }
    return SSEService.instance;
  }

  public connect(url: string, token?: string): void {
    // Prevent duplicate connections
    if (this.url === url && this.isConnected) {
      return;
    }

    this.disconnect();
    this.url = url;
    this.reconnectAttempts = 0;

    this.establishConnection(url, token);
  }

  private establishConnection(url: string, token?: string): void {
    let connectUrl = url;
    if (token && !url.includes('token=')) {
      const separator = url.includes('?') ? '&' : '?';
      connectUrl = `${url}${separator}token=${encodeURIComponent(token)}`;
    }

    try {
      this.eventSource = new EventSource(connectUrl);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyStoreListeners();
      };

      this.eventSource.onmessage = (event: MessageEvent) => {
        try {
          const parsedData: AppEvent = JSON.parse(event.data);
          this.handleMessage(parsedData);
        } catch (error) {
          console.error('[SSEService] Failed to parse message:', error);
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.notifyStoreListeners();

        // Handle reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.url) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('[SSEService] Failed to create EventSource:', error);
      this.isConnected = false;
      this.notifyStoreListeners();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000
    );

    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      if (this.url) {
        this.establishConnection(this.url);
      }
    }, delay);
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.isConnected = false;
    this.url = null;
    this.notifyStoreListeners();
  }

  private handleMessage(data: AppEvent): void {
    this.lastEvent = data;
    this.notifyStoreListeners();

    if (data.eventType) {
      const handlers = this.listeners.get(data.eventType);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(data);
          } catch (error) {
            console.error(
              `[SSEService] Error in handler for ${data.eventType}:`,
              error
            );
          }
        }
      }
    }
  }

  public addEventListener(
    eventType: string,
    handler: EventHandler
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    return () => this.removeEventListener(eventType, handler);
  }

  public removeEventListener(eventType: string, handler: EventHandler): void {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  public subscribeToStore(callback: () => void): () => void {
    this.storeListeners.add(callback);
    return () => {
      this.storeListeners.delete(callback);
    };
  }

  public getSnapshot = (): SSESnapshot => ({
    isConnected: this.isConnected,
    lastEvent: this.lastEvent,
  });

  private notifyStoreListeners(): void {
    for (const listener of this.storeListeners) {
      try {
        listener();
      } catch (error) {
        console.error('[SSEService] Error notifying listener:', error);
      }
    }
  }
}

export const sseService = SSEService.getInstance();
