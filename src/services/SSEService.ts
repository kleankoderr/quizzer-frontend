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
  private abortController: AbortController | null = null;
  private readonly listeners = new Map<string, Set<EventHandler>>();
  private url: string | null = null;
  private token: string | null = null;
  private isConnected = false;
  private lastEvent: AppEvent | null = null;
  private readonly storeListeners = new Set<() => void>();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3; // Reduced from 5 to 3
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
      console.log('[SSEService] Already connected to', url);
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
      console.error('[SSEService] No URL provided');
      return;
    }

    // Check if we've exceeded max retries
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.connectionFailed = true;
      this.isConnected = false;
      this.notifyStoreListeners();
      console.error(
        `[SSEService] Max reconnection attempts (${this.maxReconnectAttempts}) reached. Giving up.`
      );
      return;
    }

    // Don't retry if connection previously failed permanently
    if (this.connectionFailed && this.reconnectAttempts > 0) {
      console.warn('[SSEService] Connection previously failed, not retrying');
      return;
    }

    try {
      this.abortController = new AbortController();

      const headers: HeadersInit = {
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
      };

      // Add Authorization header if token is provided
      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      console.log('[SSEService] Connecting to', this.url);

      const response = await fetch(this.url, {
        headers,
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Connection successful
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.connectionFailed = false;
      this.notifyStoreListeners();
      console.log('[SSEService] Connected successfully');

      // Process the stream
      await this.processStream(response.body);
    } catch (error: any) {
      this.isConnected = false;
      this.notifyStoreListeners();

      // Don't log abort errors (user-initiated disconnects)
      if (error.name === 'AbortError') {
        console.log('[SSEService] Connection aborted');
        return;
      }

      console.error('[SSEService] Connection error:', error.message);

      // Handle reconnection with max retry limit
      if (this.reconnectAttempts < this.maxReconnectAttempts && this.url) {
        this.scheduleReconnect();
      } else {
        this.connectionFailed = true;
        this.notifyStoreListeners();
        console.error(
          `[SSEService] Failed to connect after ${this.reconnectAttempts} attempts`
        );
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
          console.log('[SSEService] Stream ended');
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
      if (error.name !== 'AbortError') {
        console.error('[SSEService] Stream processing error:', error);
      }
    } finally {
      reader.releaseLock();
    }
  }

  private processMessage(message: string): void {
    const lines = message.split('\n');
    let eventType = 'message';
    let data = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        data += line.substring(5).trim();
      }
    }

    if (data) {
      try {
        const parsedData: AppEvent = JSON.parse(data);
        this.handleMessage(parsedData);
      } catch (error) {
        console.error('[SSEService] Failed to parse message:', error);
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

    console.log(
      `[SSEService] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.establishConnection();
    }, delay);
  }

  public disconnect(): void {
    console.log('[SSEService] Disconnecting');

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
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
    connectionFailed: this.connectionFailed,
    reconnectAttempts: this.reconnectAttempts,
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
