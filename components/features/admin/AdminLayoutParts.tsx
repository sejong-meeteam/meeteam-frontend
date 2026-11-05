import type { ReactNode } from 'react';

import Link from 'next/link';
import { AlertCircle, ChevronLeft, ExternalLink } from 'lucide-react';
import BaseButton from '@/components/shared/BaseButton';

type AdminPageHeaderProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
};

export function AdminPageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel,
}: AdminPageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-mt-text-secondary transition-colors hover:text-mt-text-primary"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden strokeWidth={2} />
            {backLabel}
          </Link>
        ) : null}
        <h1 className="text-2xl leading-8 font-extrabold text-mt-text-primary">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-mt-text-secondary">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

type AdminPanelProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function AdminPanel({
  title,
  description,
  actions,
  children,
  className = '',
  bodyClassName = 'p-5',
}: AdminPanelProps) {
  return (
    <section
      className={`w-full rounded-2xl border border-mt-border bg-mt-white shadow-sm ${className}`}
    >
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-mt-border/70 px-5 py-4">
          <div>
            <h2 className="text-base leading-6 font-bold text-mt-text-primary">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs leading-4 text-mt-text-secondary">{description}</p>
            ) : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function AdminFilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-mt-border bg-mt-white p-3 shadow-sm md:flex md:flex-wrap md:items-center [&>*]:w-full md:[&>*]:w-fit">
      {children}
    </div>
  );
}

export function AdminInfoList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs leading-4 font-semibold text-mt-text-secondary">{item.label}</dt>
          <dd className="mt-1 text-sm leading-5 break-words text-mt-text-primary">
            {item.value || '-'}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function AdminErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-2xl border border-mt-border bg-mt-white px-6 py-16 text-center shadow-sm"
      role="alert"
    >
      <AlertCircle className="h-7 w-7 text-mt-danger" aria-hidden strokeWidth={1.8} />
      <p className="text-sm font-medium text-mt-text-secondary">{message}</p>
      <BaseButton size="S" variant="gray" onClick={onRetry}>
        다시 시도
      </BaseButton>
    </div>
  );
}

export function AdminEmptyText({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-mt-text-secondary">{children}</p>;
}

export function AdminExternalLink({ url }: { url: string | null }) {
  if (!url) return '-';
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 break-all text-action-primary hover:underline"
    >
      {url.replace(/^https?:\/\//, '')}
      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden strokeWidth={1.8} />
    </a>
  );
}
