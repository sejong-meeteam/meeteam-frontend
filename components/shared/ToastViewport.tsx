'use client';

import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useToastStore, type ToastMessage, type ToastTone } from '@/stores/useToastStore';

const TONE_CLASS: Record<ToastTone, string> = {
  error: 'border-mt-badge-bg bg-mt-white text-mt-hero-blue',
  success: 'border-mt-badge-bg bg-mt-white text-mt-mint',
  info: 'border-mt-border bg-mt-white text-mt-primary',
};

const ICON_MAP: Record<ToastTone, typeof AlertCircle> = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

function ToastItem({ toast }: { toast: ToastMessage }) {
  const dismissToast = useToastStore((state) => state.dismissToast);
  const Icon = ICON_MAP[toast.tone];

  useEffect(() => {
    const timer = window.setTimeout(() => dismissToast(toast.id), toast.durationMs);

    return () => window.clearTimeout(timer);
  }, [dismissToast, toast.durationMs, toast.id]);

  return (
    <div
      role="status"
      className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg ${TONE_CLASS[toast.tone]}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden strokeWidth={1.8} />
      <p className="min-w-0 flex-1 text-sm leading-5 font-semibold text-mt-text-nav">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-mt-text-secondary transition-colors hover:bg-mt-bg-soft hover:text-mt-text-primary"
        aria-label="알림 닫기"
      >
        <X className="h-4 w-4" aria-hidden strokeWidth={1.8} />
      </button>
    </div>
  );
}

export default function ToastViewport() {
  const messages = useToastStore((state) => state.messages);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-md flex-col gap-2">
        {messages.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
}
