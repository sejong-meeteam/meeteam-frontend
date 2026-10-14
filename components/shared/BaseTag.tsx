import type { HTMLAttributes, ReactNode } from 'react';

type BaseTagSize = 'L' | 'M' | 'S';

export interface BaseTagProps extends HTMLAttributes<HTMLSpanElement> {
  size?: BaseTagSize;
  selected?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const SIZE_MAP: Record<BaseTagSize, string> = {
  L: 'px-6 py-2.5 text-sm leading-6',
  M: 'px-5 py-2 text-sm leading-5',
  S: 'px-4 py-1.5 text-xs leading-4',
};

const BASE_MAP: string =
  'border border-mt-border bg-mt-white text-mt-text-secondary/90 hover:border-mt-primary/45 hover:bg-mt-logo-blue/18 hover:text-mt-primary';

const SELECTED_MAP: string =
  'border-mt-logo-blue bg-mt-badge-bg text-mt-primary hover:border-mt-primary hover:bg-mt-badge-bg';

export default function BaseTag({
  size = 'M',
  selected = false,
  leftIcon,
  rightIcon,
  className = '',
  children,
  ...props
}: BaseTagProps) {
  const sizeClass = SIZE_MAP[size];
  const variantClass = selected ? SELECTED_MAP : BASE_MAP;

  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-full border font-semibold transition-colors
        cursor-pointer
        ${sizeClass}
        ${variantClass}
        ${className}`}
      {...props}
    >
      {leftIcon && <span className="shrink-0">{leftIcon}</span>}
      <span className="leading-none">{children}</span>
      {rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </span>
  );
}
