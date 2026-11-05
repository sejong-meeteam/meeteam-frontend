import type { ReactNode } from 'react';
import { AlertCircle, Inbox } from 'lucide-react';
import BaseButton from '@/components/shared/BaseButton';
import SkeletonBlock from '@/components/shared/SkeletonBlock';

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
  caption: string;
  isLoading?: boolean;
  errorMessage?: string | null;
  emptyMessage?: string;
  skeletonRowCount?: number;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  framed?: boolean;
  className?: string;
};

export default function DataTable<T>({
  columns,
  rows,
  getRowKey,
  caption,
  isLoading = false,
  errorMessage = null,
  emptyMessage = '표시할 항목이 없습니다.',
  skeletonRowCount = 5,
  onRetry,
  onRowClick,
  framed = true,
  className = '',
}: DataTableProps<T>) {
  const showSkeleton = isLoading && rows.length === 0;

  return (
    <div
      className={`w-full overflow-hidden bg-mt-white ${
        framed ? 'rounded-2xl border border-mt-border shadow-sm' : 'rounded-xl'
      } ${className}`}
      aria-busy={isLoading}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-mt-bg-soft">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-4 py-3 text-xs leading-4 font-bold whitespace-nowrap text-mt-text-secondary ${column.className ?? ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={isLoading && rows.length > 0 ? 'opacity-60 transition-opacity' : ''}>
            {showSkeleton
              ? Array.from({ length: skeletonRowCount }, (_, index) => (
                  <tr key={index} className="border-t border-mt-border/70">
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-4">
                        <SkeletonBlock className="h-4 w-full max-w-32 rounded-md" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr
                    key={getRowKey(row)}
                    className={`border-t border-mt-border/70 transition-colors ${
                      onRowClick ? 'cursor-pointer hover:bg-mt-bg-soft/70' : ''
                    }`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3.5 align-middle text-mt-text-primary ${column.className ?? ''}`}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!isLoading && errorMessage ? (
        <div className="flex flex-col items-center gap-3 px-4 py-14 text-center" role="alert">
          <AlertCircle className="h-6 w-6 text-mt-danger" aria-hidden strokeWidth={1.8} />
          <p className="text-sm font-medium text-mt-text-secondary">{errorMessage}</p>
          {onRetry ? (
            <BaseButton size="S" variant="gray" onClick={onRetry}>
              다시 시도
            </BaseButton>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !errorMessage && rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
          <Inbox className="h-6 w-6 text-mt-text-secondary" aria-hidden strokeWidth={1.8} />
          <p className="text-sm font-medium text-mt-text-secondary">{emptyMessage}</p>
        </div>
      ) : null}
    </div>
  );
}
