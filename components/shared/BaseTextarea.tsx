import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

type BaseTextareaSize = 'L' | 'M' | 'S';

export interface BaseTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  textareaSize?: BaseTextareaSize;
  full?: boolean;
}

const SIZE_MAP: Record<BaseTextareaSize, string> = {
  L: 'px-5 py-4 text-base leading-6',
  M: 'px-4 py-3 text-sm leading-5',
  S: 'px-3 py-2.5 text-sm leading-5',
};

const BaseTextarea = forwardRef<HTMLTextAreaElement, BaseTextareaProps>(function BaseTextarea(
  { textareaSize = 'M', full = true, disabled, rows = 4, className = '', ...props },
  ref,
) {
  const sizeClass = SIZE_MAP[textareaSize];
  const widthClass = full ? 'w-full' : 'w-fit';

  return (
    <textarea
      ref={ref}
      disabled={disabled}
      rows={rows}
      className={`min-h-30 rounded-xl border border-mt-border bg-mt-white text-mt-text-primary outline-none transition-all duration-200 ease-out
        placeholder:text-mt-text-secondary
        focus:border-mt-primary focus:bg-mt-white focus:outline-none focus:ring-2 focus:ring-mt-logo-blue/20
        disabled:cursor-not-allowed disabled:bg-mt-bg-soft disabled:text-mt-text-secondary
        ${sizeClass}
        ${className}
        ${widthClass}
        resize-y
        ${className}`}
      {...props}
    />
  );
});

export default BaseTextarea;
