'use client';

import type { z } from 'zod';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

type ListFilters = Record<string, string | number> & { page: number };

export function useAdminListParams<T extends ListFilters>(schema: z.ZodType<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaults = useMemo(() => schema.parse({}), [schema]);
  const filters = useMemo(
    () => schema.parse(Object.fromEntries(searchParams.entries())),
    [schema, searchParams],
  );

  const updateFilters = useCallback(
    (patch: Partial<T>) => {
      const next = { ...filters, page: 0, ...patch };
      const query = new URLSearchParams();
      Object.entries(next).forEach(([key, value]) => {
        if (value !== defaults[key]) query.set(key, String(value));
      });
      const queryString = query.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [defaults, filters, pathname, router],
  );

  const resetFilters = useCallback(
    () => router.replace(pathname, { scroll: false }),
    [pathname, router],
  );

  const isFiltered = useMemo(
    () => Object.entries(filters).some(([key, value]) => key !== 'page' && value !== defaults[key]),
    [defaults, filters],
  );

  return { filters, updateFilters, resetFilters, isFiltered };
}
