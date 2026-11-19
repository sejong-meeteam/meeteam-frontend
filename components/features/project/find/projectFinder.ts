import type { ProjectFinderFilters } from './types';

export const INITIAL_VISIBLE_COUNT = 8;

export const RECRUIT_STATUS_OPTIONS = ['전체 상태', '모집 중만 보기'] as const;

export const PROJECT_SORT_OPTIONS = [
  { label: '최신순', value: 'latest' },
  { label: '마감임박순', value: 'deadline' },
] as const;

export function hasActiveProjectFilters(filters: ProjectFinderFilters) {
  return (
    filters.searchValue.length > 0 ||
    filters.category !== '모든 카테고리' ||
    filters.recruitOnly !== 'all' ||
    filters.platform !== '전체' ||
    filters.field !== '전체' ||
    filters.sort !== 'latest'
  );
}
