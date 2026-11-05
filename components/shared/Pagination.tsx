import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  visibleCount?: number;
  className?: string;
};

const PAGE_BUTTON_CLASS =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:opacity-40';

export default function Pagination({
  page,
  totalPages,
  onChange,
  visibleCount = 5,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const half = Math.floor(visibleCount / 2);
  const start = Math.max(0, Math.min(page - half, totalPages - visibleCount));
  const pages = Array.from(
    { length: Math.min(visibleCount, totalPages) },
    (_, index) => start + index,
  );

  return (
    <nav aria-label="페이지 이동" className={`flex items-center justify-center gap-1 ${className}`}>
      <button
        type="button"
        className={`${PAGE_BUTTON_CLASS} text-mt-text-secondary enabled:hover:bg-mt-bg-soft`}
        onClick={() => onChange(page - 1)}
        disabled={page <= 0}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden strokeWidth={2} />
      </button>
      {pages.map((item) => (
        <button
          key={item}
          type="button"
          className={`${PAGE_BUTTON_CLASS} ${
            item === page
              ? 'bg-action-primary text-mt-white'
              : 'text-mt-text-nav hover:bg-mt-bg-soft'
          }`}
          onClick={() => onChange(item)}
          aria-current={item === page ? 'page' : undefined}
          aria-label={`${item + 1}페이지`}
        >
          {item + 1}
        </button>
      ))}
      <button
        type="button"
        className={`${PAGE_BUTTON_CLASS} text-mt-text-secondary enabled:hover:bg-mt-bg-soft`}
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        aria-label="다음 페이지"
      >
        <ChevronRight className="h-4 w-4" aria-hidden strokeWidth={2} />
      </button>
    </nav>
  );
}
