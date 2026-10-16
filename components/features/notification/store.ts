'use client';

import { create } from 'zustand';

import type { NotificationItem } from './types';

type NotificationState = {
  unreadCount: number;
  latestNotification: NotificationItem | null;
  receivedIds: string[];
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  pushRealtimeNotification: (notification: NotificationItem) => void;
  resetNotifications: () => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  latestNotification: null,
  receivedIds: [],
  setUnreadCount: (count) => set({ unreadCount: Math.max(count, 0) }),
  incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  pushRealtimeNotification: (notification) =>
    set((state) =>
      state.receivedIds.includes(notification.id)
        ? state
        : {
            latestNotification: notification,
            unreadCount: state.unreadCount + 1,
            receivedIds: [...state.receivedIds, notification.id].slice(-1000),
          },
    ),
  resetNotifications: () => set({ unreadCount: 0, latestNotification: null, receivedIds: [] }),
}));
