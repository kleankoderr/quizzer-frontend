import axios from 'axios';
import type { CancelTokenSource } from 'axios';
import type { AppEvent } from '../types/events';

type EventHandler = (event: AppEvent) => void;

interface SSESnapshot {
  isConnected: boolean;
  lastEvent: AppEvent | null;
  connectionFailed: boolean;
  reconnectAttempts: number;
}

export class SSEService {
  private static instance: SSEService;
  private cancelTokenSource: CancelTokenSource | null = null;
  private readonly listeners = new Map<string, Set<EventHandler>>();
  private url: string | null = null;
  private token: string | null = null;
  private isConnected = false;
  private lastEvent: AppEvent | null = null;
  private readonly storeListeners = new Set<() => void>();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3;
  private readonly baseReconnectDelay = 1000;
  private connectionFailed = false;

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

    // Reset connection state
    this.disconnect();
    this.url = url;
    this.token = token || null;
    this.reconnectAttempts = 0;
    this.connectionFailed = false;

    this.establishConnection();
  }

  private async establishConnection(): Promise<void> {
    if (!this.url) {
      return;
    }

    // Check if we've exceeded max retries
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.connectionFailed = true;
      this.isConnected = false;
      this.notifyStoreListeners();
      return;
    }

    // Don't retry if connection previously failed permanently
    if (this.connectionFailed && this.reconnectAttempts > 0) {
      return;
    }

    try {
      this.cancelTokenSource = axios.CancelToken.source();

      const headers: Record<string, string> = {
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
      };

      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await axios.get(this.url, {
        headers,
        responseType: 'stream',
        cancelToken: this.cancelTokenSource.token,
        adapter: 'fetch', // Use fetch adapter for streaming
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.data) {
        throw new Error('Response body is null');
      }

      // Connection successful
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.connectionFailed = false;
      this.notifyStoreListeners();

      // Process the stream
      await this.processStream(response.data);
    } catch (error: any) {
      this.isConnected = false;
      this.notifyStoreListeners();

      // Don't handle cancel errors (user-initiated disconnects)
      if (axios.isCancel(error)) {
        return;
      }

      // Handle reconnection with max retry limit
      if (this.reconnectAttempts < this.maxReconnectAttempts && this.url) {
        this.scheduleReconnect();
      } else {
        this.connectionFailed = true;
        this.notifyStoreListeners();
      }
    }
  }

  private async processStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          this.isConnected = false;
          this.notifyStoreListeners();

          // Attempt reconnection if not manually disconnected
          if (this.url && !this.connectionFailed) {
            this.scheduleReconnect();
          }
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete messages (separated by \n\n)
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep incomplete message in buffer

        for (const message of messages) {
          if (message.trim()) {
            this.processMessage(message);
          }
        }
      }
    } catch (error: any) {
      if (!axios.isCancel(error)) {
        // Stream processing error - silent fail
      }
    } finally {
      reader.releaseLock();
    }
  }

  private processMessage(message: string): void {
    const lines = message.split('\n');
    let data = '';

    for (const line of lines) {
      if (line.startsWith('data:')) {
        data += line.substring(5).trim();
      }
    }

    if (data) {
      try {
        const parsedData: AppEvent = JSON.parse(data);
        this.handleMessage(parsedData);
      } catch {
        // Failed to parse message - silent fail
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Exponential backoff with max delay of 30 seconds
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000
    );

    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      this.establishConnection();
    }, delay);
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel();
      this.cancelTokenSource = null;
    }

    this.isConnected = false;
    this.url = null;
    this.token = null;
    this.connectionFailed = false;
    this.reconnectAttempts = 0;
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
          } catch {
            // Handler error - silent fail
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
    connectionFailed: this.connectionFailed,
    reconnectAttempts: this.reconnectAttempts,
  });

  private notifyStoreListeners(): void {
    for (const listener of this.storeListeners) {
      try {
        listener();
      } catch {
        // Listener error - silent fail
      }
    }
  }
}

export const sseService = SSEService.getInstance();
