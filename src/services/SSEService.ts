import type { AppEvent } from '../types/events';

interface SSEState {
  isConnected: boolean;
  lastEvent: AppEvent | null;
}

type StateChangeCallback = () => void;
type EventHandler = (event: AppEvent) => void;

class SSEService {
  private eventSource: EventSource | null = null;
  private url: string | null = null;
  private token: string | null = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private stateChangeListeners: Set<StateChangeCallback> = new Set();
  
  private state: SSEState = {
    isConnected: false,
    lastEvent: null,
  };

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isManualDisconnect = false;

  connect(url: string, token?: string): void {
    this.url = url;
    this.token = token || null;
    this.isManualDisconnect = false;
    this.createConnection();
  }

  private createConnection(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (!this.url) return;

    try {
      const connectionUrl = new URL(this.url);
      if (this.token) {
        connectionUrl.searchParams.set('token', this.token);
      }

      this.eventSource = new EventSource(connectionUrl.toString());
      this.setupEventListeners();
    } catch (error) {
      console.error('[SSE] Connection failed:', error);
      this.scheduleReconnect();
    }
  }

  private setupEventListeners(): void {
    if (!this.eventSource) return;

    this.eventSource.onopen = () => {
      console.log('[SSE] Connected');
      this.reconnectAttempts = 0;
      this.updateState({ isConnected: true, lastEvent: this.state.lastEvent });
    };

    this.eventSource.onerror = () => {
      console.error('[SSE] Connection error');
      this.updateState({ isConnected: false, lastEvent: this.state.lastEvent });
      
      if (!this.isManualDisconnect) {
        this.scheduleReconnect();
      }
    };

    // Handle all SSE messages
    this.eventSource.onmessage = (event: MessageEvent) => {
      this.handleMessage(event);
    };
  }

  private handleMessage = (event: MessageEvent): void => {
    try {
      const data = JSON.parse(event.data) as AppEvent;
      
      this.updateState({
        isConnected: true,
        lastEvent: data,
      });

      // Notify listeners immediately in microtask to prevent blocking
      queueMicrotask(() => {
        this.notifyListeners(data);
      });
    } catch (error) {
      console.error('[SSE] Failed to parse event:', error);
    }
  };

  private notifyListeners(event: AppEvent): void {
    // Notify type-specific listeners
    const typeListeners = this.listeners.get(event.eventType);
    if (typeListeners) {
      typeListeners.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`[SSE] Handler error for ${event.eventType}:`, error);
        }
      });
    }

    // Notify wildcard listeners
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error('[SSE] Wildcard handler error:', error);
        }
      });
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

    console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.createConnection();
    }, delay);
  }

  disconnect(): void {
    this.isManualDisconnect = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.updateState({ isConnected: false, lastEvent: this.state.lastEvent });
  }

  addEventListener(eventType: string, handler: EventHandler): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(handler);

    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(handler);
        if (listeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  subscribeToStore(callback: StateChangeCallback): () => void {
    this.stateChangeListeners.add(callback);
    return () => {
      this.stateChangeListeners.delete(callback);
    };
  }

  getSnapshot(): SSEState {
    return this.state;
  }

  private updateState(newState: SSEState): void {
    this.state = newState;
    this.stateChangeListeners.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('[SSE] State change callback error:', error);
      }
    });
  }
}

export const sseService = new SSEService();