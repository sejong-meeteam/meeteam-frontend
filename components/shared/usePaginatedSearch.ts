'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInfiniteScroll } from './useInfiniteScroll';

export type SearchPage<T> = {
  items: T[];
  hasMore: boolean;
  totalCount?: number;
};

type SearchState<T> = SearchPage<T> & {
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
};

type RequestScope<TFilters> = {
  filters: TFilters;
  controller: AbortController;
  page: number;
  hasMore: boolean;
  busy: boolean;
  failed: boolean;
};

type PaginatedSearchOptions<T, TFilters> = {
  filters: TFilters;
  fetchPage: (filters: TFilters, page: number, signal: AbortSignal) => Promise<SearchPage<T>>;
  initialErrorMessage: string;
  loadMoreErrorMessage: string;
  enabled?: boolean;
};

export function usePaginatedSearch<T, TFilters>({
  filters,
  fetchPage,
  initialErrorMessage,
  loadMoreErrorMessage,
  enabled = true,
}: PaginatedSearchOptions<T, TFilters>) {
  const [state, setState] = useState<SearchState<T>>({
    items: [],
    hasMore: false,
    totalCount: 0,
    isInitialLoading: true,
    isLoadingMore: false,
    isRefreshing: true,
    errorMessage: null,
  });
  const [retryKey, setRetryKey] = useState(0);
  const hasLoadedRef = useRef(false);
  const scopeRef = useRef<RequestScope<TFilters> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const scope: RequestScope<TFilters> = {
      filters,
      controller: new AbortController(),
      page: 0,
      hasMore: false,
      busy: true,
      failed: false,
    };
    scopeRef.current = scope;

    const loadInitial = async () => {
      setState((current) => ({
        ...current,
        isInitialLoading: !hasLoadedRef.current,
        isLoadingMore: false,
        isRefreshing: true,
        errorMessage: null,
      }));
      try {
        const result = await fetchPage(filters, 0, scope.controller.signal);
        if (scope.controller.signal.aborted) return;

        scope.hasMore = result.hasMore;
        scope.busy = false;
        hasLoadedRef.current = true;
        setState({
          ...result,
          isInitialLoading: false,
          isLoadingMore: false,
          isRefreshing: false,
          errorMessage: null,
        });
      } catch {
        if (scope.controller.signal.aborted) return;

        scope.failed = true;
        scope.busy = false;
        setState((current) => ({
          ...current,
          isInitialLoading: false,
          isLoadingMore: false,
          isRefreshing: false,
          errorMessage: initialErrorMessage,
        }));
      }
    };
    void loadInitial();

    return () => {
      scope.controller.abort();
      if (scopeRef.current === scope) scopeRef.current = null;
    };
  }, [enabled, fetchPage, filters, initialErrorMessage, retryKey]);

  const loadMore = useCallback(async () => {
    const scope = scopeRef.current;
    if (
      !enabled ||
      !scope ||
      scope.filters !== filters ||
      scope.controller.signal.aborted ||
      scope.busy ||
      scope.failed ||
      !scope.hasMore
    )
      return;

    // Lock synchronously: observer callbacks can arrive before React commits loading state.
    scope.busy = true;
    setState((current) => ({ ...current, isLoadingMore: true, errorMessage: null }));
    try {
      const nextPage = scope.page + 1;
      const result = await fetchPage(filters, nextPage, scope.controller.signal);
      if (scope.controller.signal.aborted) return;

      scope.page = nextPage;
      scope.hasMore = result.hasMore;
      scope.busy = false;
      setState((current) => ({
        ...current,
        items: [...current.items, ...result.items],
        hasMore: result.hasMore,
        totalCount: result.totalCount ?? current.totalCount,
        isLoadingMore: false,
      }));
    } catch {
      if (scope.controller.signal.aborted) return;

      scope.failed = true;
      scope.busy = false;
      setState((current) => ({
        ...current,
        isLoadingMore: false,
        errorMessage: loadMoreErrorMessage,
      }));
    }
  }, [enabled, fetchPage, filters, loadMoreErrorMessage]);

  const loadMoreRef = useInfiniteScroll({
    hasMore: state.hasMore,
    isLoading: !enabled || state.isRefreshing || state.isLoadingMore || Boolean(state.errorMessage),
    onLoadMore: loadMore,
  });
  const retrySearch = useCallback(() => setRetryKey((current) => current + 1), []);

  return { ...state, loadMoreRef, retrySearch };
}
