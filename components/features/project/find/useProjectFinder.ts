'use client';

import { useMemo, useState } from 'react';
import { useDebouncedValue } from '@/components/shared/useDebouncedValue';
import { usePaginatedSearch } from '@/components/shared/usePaginatedSearch';
import { fetchProjectSearchResults } from './projectFindApi';
import { INITIAL_VISIBLE_COUNT, hasActiveProjectFilters } from './projectFinder';
import type {
  CategoryFilter,
  FieldFilter,
  PlatformFilter,
  ProjectFinderFilters,
  RecruitFilter,
  SortFilter,
} from './types';

async function fetchProjectPage(filters: ProjectFinderFilters, page: number, signal: AbortSignal) {
  const result = await fetchProjectSearchResults(filters, page, INITIAL_VISIBLE_COUNT, signal);
  return { items: result.projects, hasMore: result.hasMore };
}

export function useProjectFinder() {
  const [searchValue, setSearchValue] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('모든 카테고리');
  const [recruitOnly, setRecruitOnly] = useState<RecruitFilter>('all');
  const [platform, setPlatform] = useState<PlatformFilter>('전체');
  const [field, setField] = useState<FieldFilter>('전체');
  const [sort, setSort] = useState<SortFilter>('latest');
  const debouncedSearch = useDebouncedValue(searchValue.trim());
  const searchFilters = useMemo(
    () => ({ searchValue: debouncedSearch, category, recruitOnly, platform, field, sort }),
    [category, debouncedSearch, field, platform, recruitOnly, sort],
  );
  const {
    items,
    hasMore,
    isInitialLoading,
    isLoadingMore,
    errorMessage,
    loadMoreRef,
    retrySearch,
  } = usePaginatedSearch({
    filters: searchFilters,
    fetchPage: fetchProjectPage,
    enabled: searchValue.trim() === debouncedSearch,
    initialErrorMessage: '프로젝트 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
    loadMoreErrorMessage: '프로젝트를 더 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
  });
  const filters = { ...searchFilters, searchValue };

  const resetFilters = () => {
    setSearchValue('');
    setCategory('모든 카테고리');
    setRecruitOnly('all');
    setPlatform('전체');
    setField('전체');
    setSort('latest');
  };

  return {
    filters,
    projects: items,
    hasMore,
    isInitialLoading,
    isLoadingMore,
    errorMessage,
    countLabel: hasMore ? `${items.length}+` : String(items.length),
    hasActiveFilters: hasActiveProjectFilters(filters),
    loadMoreRef,
    retrySearch,
    setSearchValue,
    setCategory,
    setRecruitOnly,
    setPlatform,
    setField,
    setSort,
    resetFilters,
  };
}
