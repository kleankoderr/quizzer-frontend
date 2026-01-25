import { API_BASE_URL } from '../config/api';
import { TokenService } from './api';

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
  | 'summary.failed';

export interface AppEvent {
  eventType: EventType;
  userId: string;
  timestamp?: number;
  [key: string]: any;
}

type EventHandler = (event: AppEvent) => void;

class EventsService {
  private eventSource: EventSource | null = null;
  private readonly listeners: Map<string, EventHandler[]> = new Map();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;

  connect() {
    if (this.eventSource || this.isConnecting) return;

    this.isConnecting = true;

    // Get access token and append as query parameter (EventSource can't send headers)
    const token = TokenService.getAccessToken();
    if (!token) {
      console.warn('No access token available for SSE connection');
      this.isConnecting = false;
      return;
    }

    const url = `${API_BASE_URL}/events/sse?token=${encodeURIComponent(token)}`;

    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log('SSE Connected');
      this.isConnecting = false;
      clearTimeout(this.reconnectTimeout!);
      this.reconnectTimeout = null;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const eventData = parsed.data || parsed;
        this.emit(eventData.eventType, eventData);
      } catch (error) {
        console.error('Failed to parse SSE message', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE Error', error);
      this.eventSource?.close();
      this.eventSource = null;
      this.isConnecting = false;

      if (!this.reconnectTimeout) {
        this.reconnectTimeout = setTimeout(() => this.connect(), 5000);
      }
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnecting = false;
      clearTimeout(this.reconnectTimeout!);
      this.reconnectTimeout = null;
    }
  }

  on(eventType: string, handler: EventHandler) {
    if (!this.eventSource) {
      this.connect();
    }

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)?.push(handler);

    // Return unsubscribe function
    return () => this.off(eventType, handler);
  }

  off(eventType: string, handler: EventHandler) {
    if (!this.listeners.has(eventType)) return;

    const handlers = this.listeners.get(eventType)!;
    const index = handlers.indexOf(handler);

    if (index !== -1) {
      handlers.splice(index, 1);
    }

    if (handlers.length === 0) {
      this.listeners.delete(eventType);
    }
  }

  private emit(eventType: string, event: AppEvent) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)?.forEach((handler) => handler(event));
    }
  }
}

export const eventsService = new EventsService();
