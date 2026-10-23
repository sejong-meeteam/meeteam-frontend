'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import Portal from '@/components/shared/Portal';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel?: string;
  labelledBy?: string;
  describedBy?: string;
}

const OPEN_DIALOGS: HTMLElement[] = [];
let originalOverflow = '';
const FOCUSABLE =
  'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export default function BaseModal({ isOpen, ...props }: BaseModalProps) {
  if (!isOpen) return null;
  return (
    <Portal>
      <ModalSurface {...props} />
    </Portal>
  );
}

function ModalSurface({
  onClose,
  children,
  ariaLabel = '대화상자',
  labelledBy,
  describedBy,
}: Omit<BaseModalProps, 'isOpen'>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (OPEN_DIALOGS.length === 0) originalOverflow = document.body.style.overflow;
    OPEN_DIALOGS.push(container);
    document.body.style.overflow = 'hidden';
    const focusable = () =>
      [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.getClientRects().length > 0 && element.tabIndex >= 0,
      );
    const focusFirst = () => (focusable()[0] ?? container).focus();
    focusFirst();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (OPEN_DIALOGS.at(-1) !== container) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      }
      if (event.key === 'Tab') {
        const controls = focusable();
        const first = controls[0];
        const last = controls.at(-1);
        if (!first) {
          event.preventDefault();
          container.focus();
        } else if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === container)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const containFocus = (event: FocusEvent) => {
      if (OPEN_DIALOGS.at(-1) === container && !container.contains(event.target as Node))
        focusFirst();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', containFocus);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', containFocus);
      const index = OPEN_DIALOGS.indexOf(container);
      if (index >= 0) OPEN_DIALOGS.splice(index, 1);
      if (OPEN_DIALOGS.length === 0) document.body.style.overflow = originalOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-mt-text-primary/40 px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="w-full max-w-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : ariaLabel}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
      >
        {children}
      </div>
    </div>
  );
}
