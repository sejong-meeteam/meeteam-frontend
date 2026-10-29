'use client';

import { useState, type ReactNode } from 'react';
import { Check, CheckCheck, Copy, Info } from 'lucide-react';
import { useToastStore } from '@/stores/useToastStore';

export function CopyButton({ value, label = '코드 복사' }: { value: string; label?: string }) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const showToast = useToastStore((state) => state.showToast);
  const copied = copiedValue === value;

  return (
    <button
      type="button"
      aria-label={copied ? '복사 완료' : label}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-mt-border bg-mt-white px-2.5 py-1.5 text-xs font-medium text-mt-text-secondary transition-colors hover:bg-mt-bg-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopiedValue(value);
          showToast({ tone: 'success', message: '클립보드에 복사했어요.', durationMs: 2000 });
        } catch {
          showToast({
            tone: 'error',
            message: '복사하지 못했어요. 텍스트를 직접 선택해 복사해 주세요.',
          });
        }
      }}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
      <span aria-live="polite">{copied ? '복사 완료' : '복사'}</span>
    </button>
  );
}

export function CodeBlock({ code, filename = 'example.tsx' }: { code: string; filename?: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-mt-border">
      <div className="flex items-center justify-between gap-3 border-b border-mt-border bg-mt-bg-soft px-4 py-2.5">
        <span className="font-mono text-xs text-mt-text-secondary">{filename}</span>
        <CopyButton value={code} />
      </div>
      <pre
        className="overflow-x-auto bg-mt-white p-5 font-mono text-xs leading-7 text-action-primary sm:text-sm"
        tabIndex={0}
        aria-label="사용 예시 코드"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function DocSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-mt-text-primary">{title}</h2>
        {description && (
          <p className="mt-2 text-sm leading-6 text-mt-text-secondary">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export function Guidance({
  items,
  accessibility = false,
}: {
  items: string[];
  accessibility?: boolean;
}) {
  return (
    <ul className="space-y-4 rounded-2xl border border-mt-border bg-mt-bg-soft/50 p-5 sm:p-6">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-7 text-mt-text-secondary">
          {accessibility ? (
            <CheckCheck className="mt-1 h-4 w-4 shrink-0 text-action-primary" aria-hidden />
          ) : (
            <Info className="mt-1 h-4 w-4 shrink-0 text-action-primary" aria-hidden />
          )}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
