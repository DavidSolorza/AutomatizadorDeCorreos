type EventHandler<T = any> = (data: T) => void;

type Unsubscribe = () => void;

class EventBus {
  private listeners = new Map<string, Set<EventHandler>>();
  private history = new Map<string, any[]>();
  private maxHistory = 50;

  on<T = any>(event: string, handler: EventHandler<T>): Unsubscribe {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.listeners.get(event)?.delete(handler);
  }

  once<T = any>(event: string, handler: EventHandler<T>): Unsubscribe {
    const wrapper: EventHandler<T> = (data) => {
      handler(data);
      unsubscribe();
    };
    const unsubscribe = this.on(event, wrapper);
    return unsubscribe;
  }

  emit<T = any>(event: string, data?: T): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (e) {
          console.error(`[EventBus] Error in handler for "${event}":`, e);
        }
      });
    }

    if (!this.history.has(event)) {
      this.history.set(event, []);
    }
    const history = this.history.get(event)!;
    history.push({ data, timestamp: Date.now() });
    if (history.length > this.maxHistory) {
      history.shift();
    }
  }

  off<T = any>(event: string, handler: EventHandler<T>): void {
    this.listeners.get(event)?.delete(handler);
  }

  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
      this.history.delete(event);
    } else {
      this.listeners.clear();
      this.history.clear();
    }
  }

  getHistory<T = any>(event: string, limit = 10): T[] {
    return (this.history.get(event) || []).slice(-limit).map((e) => e.data);
  }
}

export const eventBus = new EventBus();

export const Events = {
  AUTH_LOGIN: "auth:login",
  AUTH_LOGOUT: "auth:logout",
  SYNC_STARTED: "sync:started",
  SYNC_COMPLETED: "sync:completed",
  SYNC_ERROR: "sync:error",
  EMAIL_CREATED: "email:created",
  EMAIL_UPDATED: "email:updated",
  EMAIL_DELETED: "email:deleted",
  TASK_DETECTED: "task:detected",
  TASK_CREATED: "task:created",
  TASK_UPDATED: "task:updated",
  NOTIFICATION_CREATED: "notification:created",
  GMAIL_CONNECTED: "gmail:connected",
  GMAIL_DISCONNECTED: "gmail:disconnected",
} as const;
