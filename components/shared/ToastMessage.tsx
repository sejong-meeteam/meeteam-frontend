'use client';

import { useEffect, useRef } from 'react';
import { useToastStore, type ToastTone } from '@/stores/useToastStore';

type ToastMessageProps = {
  message?: string | null;
  tone?: ToastTone;
};

export default function ToastMessage({ message, tone = 'error' }: ToastMessageProps) {
  const showToast = useToastStore((state) => state.showToast);
  const previousMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (!message) {
      previousMessageRef.current = null;
      return;
    }

    if (previousMessageRef.current === message) {
      return;
    }

    previousMessageRef.current = message;
    showToast({ tone, message });
  }, [message, showToast, tone]);

  return null;
}
