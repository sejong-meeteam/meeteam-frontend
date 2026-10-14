import type { ReactNode } from 'react';

export interface BaseFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  hintText?: string;
  errorText?: string;
  className?: string;
  children?: ReactNode;
}

export default function BaseField({
  label,
  htmlFor,
  required = true,
  hintText,
  errorText,
  className = '',
  children,
}: BaseFieldProps) {
  return (
    <div className={`flex w-full flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-lg font-bold leading-7 text-mt-text-primary" htmlFor={htmlFor}>
          {label}
          {!required && (
            <span className="ml-2 text-sm font-semibold text-mt-text-secondary">(선택)</span>
          )}
        </label>
      )}

      {children}

      {errorText ? (
        <p className="text-sm leading-5 text-mt-hero-blue">{errorText}</p>
      ) : hintText ? (
        <p className="text-sm leading-5 text-mt-text-secondary">{hintText}</p>
      ) : null}
    </div>
  );
}
