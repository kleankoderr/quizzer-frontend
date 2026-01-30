import { API_BASE_URL } from '../config/api';
import { apiClient } from './api';

export type EventType =
  | 'quiz.progress'
  | 'quiz.completed'
  | 'quiz.failed'
  | 'flashcard.progress'
  | 'flashcard.completed'
  | 'flashcard.failed'
  | 'content.progress'
  | 'content.completed'
  | 'content.failed'
  | 'summary.progress'
  | 'summary.chunk'
  | 'summary.completed'
  | 'summary.failed'
  | 'learning-guide.outline.completed'
  | 'learning-guide.section.started'
  | 'learning-guide.section.chunk'
  | 'learning-guide.section.completed'
  | 'learning-guide.all-sections.completed';

export interface AppEvent {
  eventType: EventType;
  userId: string;
  timestamp?: number;
  [key: string]: unknown;
}

type EventHandler<T = AppEvent> = (event: T) => void;

export class EventsService {
  private eventSource?: EventSource;
  private readonly listeners = new Map<EventType, Set<EventHandler>>();
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private connecting = false;

  async connect(): Promise<void> {
    if (this.eventSource || this.connecting) return;

    this.connecting = true;

    try {
      const token = await this.fetchSseToken();
      this.openEventSource(token);
    } catch (error) {
      this.handleConnectionFailure(error);
    }
  }

  disconnect(): void {
    this.clearReconnectTimer();
    this.eventSource?.close();
    this.eventSource = undefined;
    this.connecting = false;
  }

  on(eventType: EventType, handler: EventHandler) {
    if (!this.eventSource) {
      this.connect();
    }

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(handler);

    return () => this.off(eventType, handler);
  }

  off(eventType: EventType, handler: EventHandler): void {
    const handlers = this.listeners.get(eventType);
    if (!handlers) return;

    handlers.delete(handler);

    if (handlers.size === 0) {
      this.listeners.delete(eventType);
    }
  }

  private emit(event: AppEvent): void {
    this.listeners.get(event.eventType)?.forEach((handler) => {
      try {
        handler(event);
      } catch {
        return;
      }
    });
  }

  private async fetchSseToken(): Promise<string> {
    try {
      const { data } = await apiClient.post<{ token: string }>('/events/token');

      if (!data?.token) {
        throw new Error('Missing SSE token in response');
      }

      return data.token;
    } catch (error) {
      console.error('[EventsService] Failed to fetch SSE token:', error);
      throw error;
    }
  }

  private openEventSource(token: string): void {
    try {
      const url = new URL(`${API_BASE_URL}/events/sse`);
      url.searchParams.set('token', token);

      console.debug('[EventsService] Connecting to SSE...');

      if (this.eventSource) {
        this.eventSource.close();
      }

      this.eventSource = new EventSource(url.toString());

      this.eventSource.onopen = () => {
        console.debug('[EventsService] SSE connection established');
        this.connecting = false;
        this.clearReconnectTimer();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          // Ignore heartbeats
          if (payload?.data?.type === 'heartbeat') {
            return;
          }
          this.emit(payload.data ?? payload);
        } catch (error) {
          console.error('[EventsService] Failed to parse SSE message:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('[EventsService] SSE connection error:', error);
        this.handleConnectionFailure(error);
      };
    } catch (error) {
      console.error('[EventsService] Error initializing EventSource:', error);
      this.handleConnectionFailure(error);
    }
  }

  private handleConnectionFailure(_: unknown): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
    this.connecting = false;
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect();
    }, 5000);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }
}

export const eventsService = new EventsService();
