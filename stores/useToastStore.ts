'use client';

import { create } from 'zustand';

export type ToastTone = 'error' | 'success' | 'info';

export type ToastMessage = {
  id: string;
  tone: ToastTone;
  message: string;
  durationMs: number;
};

type ShowToastPayload = {
  tone?: ToastTone;
  message: string;
  durationMs?: number;
};

type ToastState = {
  messages: ToastMessage[];
  showToast: (payload: ShowToastPayload) => string;
  dismissToast: (id: string) => void;
};

const DEFAULT_DURATION_MS = 4200;

function createToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useToastStore = create<ToastState>((set) => ({
  messages: [],
  showToast: ({ tone = 'error', message, durationMs = DEFAULT_DURATION_MS }) => {
    const id = createToastId();

    set((state) => ({
      messages: [...state.messages, { id, tone, message, durationMs }].slice(-3),
    }));

    return id;
  },
  dismissToast: (id) =>
    set((state) => ({
      messages: state.messages.filter((message) => message.id !== id),
    })),
}));
