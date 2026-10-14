import type { InputHTMLAttributes, ReactNode } from 'react';

type BaseInputSize = 'L' | 'M' | 'S';

export interface BaseInputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: BaseInputSize;
  full?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  error?: boolean;
}

const SIZE_MAP: Record<BaseInputSize, string> = {
  L: 'px-5 py-4 text-base leading-6',
  M: 'px-4 py-3 text-sm leading-5',
  S: 'px-3 py-2.5 text-sm leading-5',
};

export default function BaseInput({
  inputSize = 'M',
  full = true,
  type = 'text',
  disabled,
  leftIcon,
  rightIcon,
  error = false,
  className = '',
  ...props
}: BaseInputProps) {
  const sizeClass = SIZE_MAP[inputSize];
  const widthClass = full ? 'w-full' : 'w-fit';
  const leftPaddingClass = leftIcon ? 'pl-11' : '';
  const rightPaddingClass = rightIcon ? 'pr-11' : '';

  return (
    <div className={`relative ${widthClass}`}>
      {leftIcon && (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-mt-text-secondary">
          {leftIcon}
        </span>
      )}
      <input
        type={type}
        disabled={disabled}
        className={`rounded-xl border border-mt-border bg-mt-white text-mt-text-primary outline-none transition-all duration-200 ease-out
          placeholder:text-mt-text-secondary
          focus:border-mt-primary focus:bg-mt-white focus:outline-none focus:ring-2 focus:ring-mt-logo-blue/20
          ${error ? 'border-mt-hero-blue bg-mt-badge-bg/20 focus:border-mt-hero-blue focus:ring-mt-hero-blue/20' : ''}
          disabled:cursor-not-allowed disabled:bg-mt-bg-soft disabled:text-mt-text-secondary
          ${sizeClass}
          ${leftPaddingClass}
          ${rightPaddingClass}
          ${className}
          ${widthClass}`}
        {...props}
      />
      {rightIcon && (
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-mt-text-secondary">
          {rightIcon}
        </span>
      )}
    </div>
  );
}
