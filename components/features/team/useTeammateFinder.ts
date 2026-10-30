'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@/components/shared/useDebouncedValue';
import { usePaginatedSearch } from '@/components/shared/usePaginatedSearch';
import { fetchJobOptions } from '@/components/features/auth/signupApi';
import { collectTechStackNames } from '@/components/features/auth/jobOptionUtils';
import { fetchTeammates, type FetchTeammatesParams, type TeammateSort } from './teamApi';
import { TEAMMATE_LIST_CONFIG, TEAMMATE_ROLE_OPTIONS } from './constants';

const TEAMMATE_LIST_ERROR_MESSAGE = '팀원 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
const TEAMMATE_LOAD_MORE_ERROR_MESSAGE = '팀원을 더 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';

const JOB_FIELD_ID_BY_CODE: Record<string, number> = {
  PLANNING: 1,
  DESIGN: 2,
  FRONTEND: 3,
  BACKEND: 4,
  AI: 5,
  INFRA_OPERATION: 6,
};

const JOB_FIELD_CODE_BY_ROLE: Partial<Record<(typeof TEAMMATE_ROLE_OPTIONS)[number], string>> = {
  프론트엔드: 'FRONTEND',
  백엔드: 'BACKEND',
  디자이너: 'DESIGN',
  'PM/기획': 'PLANNING',
  AI: 'AI',
  '인프라/운영': 'INFRA_OPERATION',
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
  const [selectedRole, setSelectedRole] = useState<(typeof TEAMMATE_ROLE_OPTIONS)[number]>('전체');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [sort, setSort] = useState<TeammateSort>('projectCount');
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    const loadSkillOptions = async () => {
      try {
        const nextJobFields = await fetchJobOptions();

        if (!active) {
          return;
        }

        setAvailableSkills(collectTechStackNames(nextJobFields));
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

  const selectedJobFieldId = useMemo(() => resolveJobFieldId(selectedRole), [selectedRole]);

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

function resolveJobFieldId(role: (typeof TEAMMATE_ROLE_OPTIONS)[number]) {
  if (role === '전체') {
    return undefined;
  }

  const jobFieldCode = JOB_FIELD_CODE_BY_ROLE[role];

  if (!jobFieldCode) {
    return undefined;
  }

  return JOB_FIELD_ID_BY_CODE[jobFieldCode];
}
