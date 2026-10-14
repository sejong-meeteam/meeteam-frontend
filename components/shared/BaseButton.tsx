import type { ButtonHTMLAttributes, ReactNode } from 'react';

type BaseButtonSize = 'XL' | 'L' | 'M' | 'S' | 'XS';
type BaseButtonVariant = 'primary' | 'gray';

export interface BaseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: BaseButtonSize;
  variant?: BaseButtonVariant;
  full?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  children: ReactNode;
}

const SIZE_MAP: Record<BaseButtonSize, string> = {
  XL: 'h-14 px-6 text-base leading-6',
  L: 'h-12 px-5 text-sm leading-5',
  M: 'h-10 px-4 text-sm leading-5',
  S: 'h-9 px-3 text-sm leading-5',
  XS: 'h-8 px-3 text-xs leading-4',
};

const VARIANT_MAP: Record<BaseButtonVariant, string> = {
  primary: 'border-none bg-mt-primary text-mt-white',
  gray: 'border border-mt-border bg-mt-white text-mt-text-secondary',
};

export default function BaseButton({
  size = 'M',
  variant = 'primary',
  full = false,
  className = '',
  type = 'button',
  onClick,
  disabled,
  children,
  ...props
}: BaseButtonProps) {
  const sizeClass = SIZE_MAP[size];
  const variantClass = VARIANT_MAP[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      {...props}
      className={`inline-flex items-center justify-center rounded-xl font-bold cursor-pointer shadow-sm
        disabled:cursor-not-allowed disabled:opacity-50
        ${variantClass}
        ${sizeClass}
        ${full ? 'w-full' : 'w-fit'}
        ${className}`}
    >
      {children}
    </button>
  );
}
