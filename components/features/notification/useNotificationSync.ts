'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';

import { fetchUnreadNotificationCount } from './notificationApi';
import { useNotificationStore } from './store';
import { readNotificationStream } from './notificationStream';

export function useNotificationSync(enabled: boolean) {
  const memberId = useAuthStore((state) => state.memberId);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const pushRealtimeNotification = useNotificationStore((state) => state.pushRealtimeNotification);
  const resetNotifications = useNotificationStore((state) => state.resetNotifications);

  useEffect(() => {
    resetNotifications();
    if (!enabled) {
      return undefined;
    }

    let active = true;

    const syncUnreadCount = async () => {
      try {
        const nextUnreadCount = await fetchUnreadNotificationCount();

        if (active) {
          setUnreadCount(nextUnreadCount);
        }
      } catch {
        // Preserve the last known count when the server cannot be reached.
      }
    };

    void syncUnreadCount();

    return () => {
      active = false;
    };
  }, [enabled, memberId, resetNotifications, setUnreadCount]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const controller = new AbortController();
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let lastEventId = '';
    let retryDelay = 1000;
    const connect = async () => {
      try {
        await readNotificationStream(
          controller.signal,
          (notification) => {
            retryDelay = 1000;
            pushRealtimeNotification(notification);
          },
          lastEventId,
          (id) => {
            lastEventId = id;
          },
        );
      } catch {
        // apiFetch handles expired sessions; transient failures reconnect below.
      }
      if (!controller.signal.aborted) {
        retryTimer = setTimeout(() => void connect(), retryDelay);
        retryDelay = Math.min(retryDelay * 2, 30000);
      }
    };
    void connect();

    return () => {
      controller.abort();
      clearTimeout(retryTimer);
    };
  }, [enabled, memberId, pushRealtimeNotification]);
}
