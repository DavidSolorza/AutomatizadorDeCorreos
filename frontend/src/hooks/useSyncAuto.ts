import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { eventBus, Events } from '@/lib/event-bus';

const SYNC_INTERVAL = 5 * 60 * 1000;

export function useSyncAuto() {
  const queryClient = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const unsubSyncCompleted = eventBus.on(Events.SYNC_COMPLETED, () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summaries'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    const unsubEmailCreated = eventBus.on(Events.EMAIL_CREATED, () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    });

    const unsubNotification = eventBus.on(Events.NOTIFICATION_CREATED, () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    const unsubTaskDetected = eventBus.on(Events.TASK_DETECTED, () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    const unsubGmailConnected = eventBus.on(Events.GMAIL_CONNECTED, () => {
      queryClient.invalidateQueries({ queryKey: ['gmail-accounts'] });
    });

    return () => {
      unsubSyncCompleted();
      unsubEmailCreated();
      unsubNotification();
      unsubTaskDetected();
      unsubGmailConnected();
    };
  }, [queryClient]);
}
