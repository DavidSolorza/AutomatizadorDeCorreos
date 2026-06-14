import { useEffect, useRef } from 'react';
import { eventBus, Events } from '@/lib/event-bus';
import { USE_MOCK } from '@/config';

const SSE_URL = '/api/v1/gmail/events';

interface SSEEvent {
  type: string;
  data: any;
  timestamp: string;
  source: string;
}

const EVENT_MAP: Record<string, string> = {
  'sync.started': Events.SYNC_STARTED,
  'sync.completed': Events.SYNC_COMPLETED,
  'sync.error': Events.SYNC_ERROR,
  'email.created': Events.EMAIL_CREATED,
  'notification.created': Events.NOTIFICATION_CREATED,
  'gmail.connected': Events.GMAIL_CONNECTED,
  'gmail.disconnected': Events.GMAIL_DISCONNECTED,
  'task.detected': Events.TASK_DETECTED,
};

export function useSSE() {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (USE_MOCK) return;

    let eventSource = new EventSource(SSE_URL);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.debug('[SSE] Connected');
    };

    eventSource.addEventListener('message', (e) => {
      try {
        const payload: SSEEvent = JSON.parse(e.data);
        const frontendEvent = EVENT_MAP[payload.type];
        if (frontendEvent) {
          eventBus.emit(frontendEvent, payload.data);
        }
      } catch {
        // ignore parse errors
      }
    });

    eventSource.onerror = () => {
      console.debug('[SSE] Reconnecting...');
      eventSource.close();
      setTimeout(() => {
        if (document.visibilityState !== 'hidden') {
          eventSource = new EventSource(SSE_URL);
          eventSourceRef.current = eventSource;
        }
      }, 3000);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, []);
}
