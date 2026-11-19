import type {
  FINDER_CATEGORY_OPTIONS,
  FINDER_PLATFORM_OPTIONS,
} from '@/components/features/project/constants';
import type { JobFieldFilter } from '@/constants/jobField';

export type PlatformFilter = (typeof FINDER_PLATFORM_OPTIONS)[number];
export type FieldFilter = JobFieldFilter;
export type RecruitFilter = 'all' | 'recruiting';
export type SortFilter = 'latest' | 'deadline';
export type CategoryFilter = (typeof FINDER_CATEGORY_OPTIONS)[number];

export type ProjectFinderFilters = {
  searchValue: string;
  category: CategoryFilter;
  recruitOnly: RecruitFilter;
  platform: PlatformFilter;
  field: FieldFilter;
  sort: SortFilter;
};
