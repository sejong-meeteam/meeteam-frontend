'use client';

type Tab<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

type TabsProps<T extends string> = {
  label: string;
  value: T;
  tabs: Tab<T>[];
  onChange: (value: T) => void;
};

export default function Tabs<T extends string>({ label, value, tabs, onChange }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 border-b border-mt-border">
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
              selected
                ? 'border-action-primary text-action-primary'
                : 'border-transparent text-mt-text-secondary hover:text-mt-text-primary'
            }`}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span
                className={`rounded-full px-1.5 text-xs leading-5 ${
                  selected ? 'bg-mt-badge-bg' : 'bg-mt-bg-soft'
                }`}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
