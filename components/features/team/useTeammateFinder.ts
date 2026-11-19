'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@/components/shared/useDebouncedValue';
import { usePaginatedSearch } from '@/components/shared/usePaginatedSearch';
import { fetchJobOptions } from '@/components/features/auth/signupApi';
import { collectTechStackNames } from '@/components/features/auth/jobOptionUtils';
import {
  JOB_FIELD_FILTER_ALL,
  toJobFieldFilterOptions,
  type JobFieldCode,
  type JobFieldFilter,
} from '@/constants/jobField';
import { fetchTeammates, type FetchTeammatesParams, type TeammateSort } from './teamApi';
import { TEAMMATE_LIST_CONFIG } from './constants';

const TEAMMATE_LIST_ERROR_MESSAGE = '팀원 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
const TEAMMATE_LOAD_MORE_ERROR_MESSAGE = '팀원을 더 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';

const JOB_FIELD_ID_BY_CODE: Record<JobFieldCode, number> = {
  PLANNING: 1,
  DESIGN: 2,
  FRONTEND: 3,
  BACKEND: 4,
  AI: 5,
  INFRA_OPERATION: 6,
  MARKETING: 7,
  DATA: 8,
};

async function fetchTeammatePage(filters: FetchTeammatesParams, page: number, signal: AbortSignal) {
  const result = await fetchTeammates(
    { ...filters, page, size: TEAMMATE_LIST_CONFIG.initialVisibleCount },
    signal,
  );
  return { items: result.teammates, hasMore: !result.last, totalCount: result.totalCount };
}

export function useTeammateFinder() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedRole, setSelectedRole] = useState<JobFieldFilter>(JOB_FIELD_FILTER_ALL);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [sort, setSort] = useState<TeammateSort>('projectCount');
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState(() => toJobFieldFilterOptions([]));

  useEffect(() => {
    let active = true;

    const loadSkillOptions = async () => {
      try {
        const nextJobFields = await fetchJobOptions();

        if (!active) {
          return;
        }

        setAvailableSkills(collectTechStackNames(nextJobFields));
        setRoleOptions(toJobFieldFilterOptions(nextJobFields));
      } catch {
        if (active) {
          setAvailableSkills([]);
        }
      }
    };

    void loadSkillOptions();

    return () => {
      active = false;
    };
  }, []);

  const selectedJobFieldId =
    selectedRole === JOB_FIELD_FILTER_ALL ? undefined : JOB_FIELD_ID_BY_CODE[selectedRole];

  const debouncedSearch = useDebouncedValue(searchValue.trim());
  const filters = useMemo(
    () => ({
      name: debouncedSearch,
      jobFieldId: selectedJobFieldId,
      techStackNames: selectedSkills,
      sort,
    }),
    [debouncedSearch, selectedJobFieldId, selectedSkills, sort],
  );
  const {
    items,
    totalCount,
    hasMore,
    isInitialLoading,
    isLoadingMore,
    errorMessage,
    loadMoreRef,
    retrySearch,
  } = usePaginatedSearch({
    filters,
    fetchPage: fetchTeammatePage,
    enabled: searchValue.trim() === debouncedSearch,
    initialErrorMessage: TEAMMATE_LIST_ERROR_MESSAGE,
    loadMoreErrorMessage: TEAMMATE_LOAD_MORE_ERROR_MESSAGE,
  });

  return {
    searchValue,
    selectedRole,
    roleOptions,
    selectedSkills,
    sort,
    availableSkills,
    visibleTeammates: items,
    filteredTeammatesCount: totalCount ?? items.length,
    isInitialLoading,
    isLoadingMore,
    errorMessage,
    hasMore,
    loadMoreRef,
    retrySearch,
    setSearchValue,
    setSelectedRole,
    setSelectedSkills,
    setSort,
  };
}
