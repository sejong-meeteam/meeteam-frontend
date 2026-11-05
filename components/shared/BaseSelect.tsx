import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

type BaseSelectSize = 'M' | 'S';

export type BaseSelectOption = {
  value: string;
  label: string;
};

export interface BaseSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: readonly BaseSelectOption[];
  selectSize?: BaseSelectSize;
  full?: boolean;
}

const SIZE_MAP: Record<BaseSelectSize, string> = {
  M: 'h-11 pl-4 pr-10 text-sm leading-5',
  S: 'h-10 pl-3 pr-9 text-sm leading-5',
};

export default function BaseSelect({
  options,
  selectSize = 'S',
  full = false,
  className = '',
  ...props
}: BaseSelectProps) {
  return (
    <div className={`relative ${full ? 'w-full' : 'w-fit'}`}>
      <select
        {...props}
        className={`w-full cursor-pointer appearance-none rounded-xl border border-mt-border bg-mt-white font-medium text-mt-text-primary outline-none transition-all duration-200
          focus:border-mt-primary focus:ring-2 focus:ring-mt-logo-blue/20
          disabled:cursor-not-allowed disabled:bg-mt-bg-soft disabled:text-mt-text-secondary
          ${SIZE_MAP[selectSize]}
          ${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-mt-text-secondary"
        aria-hidden
        strokeWidth={1.8}
      />
    </div>
  );
}
