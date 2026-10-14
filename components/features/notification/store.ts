'use client';

import { create } from 'zustand';

type NotificationUiState = { unreadCount: number; setUnreadCount: (count: number) => void };

export const useNotificationUiStore = create<NotificationUiState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (unreadCount) => set({ unreadCount }),
}));
