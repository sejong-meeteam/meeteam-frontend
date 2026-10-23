'use client';

import { useEffect, useRef, useId } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SelectMenu from '@/components/shared/SelectMenu';

type BaseDropdownProps = {
  value?: string;
  placeholder: string;
  open: boolean;
  items: string[];
  onToggle: () => void;
  onSelect: (value: string) => void;
  disabled?: boolean;
  containerClassName?: string;
  buttonClassName?: string;
  textClassName?: string;
  selectMenuClassName?: string;
  dataCy?: string;
};

export default function BaseDropdown({
  value,
  placeholder,
  open,
  items,
  onToggle,
  onSelect,
  disabled = false,
  containerClassName = '',
  buttonClassName = '',
  textClassName = '',
  selectMenuClassName = '',
  dataCy,
}: BaseDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const label = value || placeholder;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) {
        return;
      }

      onToggle();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onToggle();
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onToggle, open]);

  return (
    <div ref={containerRef} className={`relative ${containerClassName}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        data-cy={dataCy}
        className={`flex w-full rounded-xl border border-mt-border text-mt-text-nav
          disabled:cursor-not-allowed disabled:bg-mt-bg-soft disabled:text-mt-text-secondary ${buttonClassName}`}
      >
        <span className={textClassName}>{label}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-mt-text-secondary" aria-hidden strokeWidth={1.8} />
        ) : (
          <ChevronDown className="h-4 w-4 text-mt-text-secondary" aria-hidden strokeWidth={1.8} />
        )}
      </button>
      {open && items.length > 0 && (
        <SelectMenu
          id={menuId}
          items={items}
          onSelect={(item) => {
            onSelect(item);
            requestAnimationFrame(() => buttonRef.current?.focus());
          }}
          className={selectMenuClassName}
        />
      )}
    </div>
  );
}
