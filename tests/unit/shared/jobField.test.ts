import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchProjectSearchResults } from '@/components/features/project/find/projectFindApi';
import type { ProjectFinderFilters } from '@/components/features/project/find/types';
import { findProjectJobField } from '@/components/features/project/projectJobOptions';
import { fetchTeammates } from '@/components/features/team/teamApi';
import { formatJobRole } from '@/components/shared/jobRoleFormat';
import {
  findJobFieldOption,
  getJobFieldLabel,
  getJobFieldOptionLabel,
  toJobFieldFilterOptions,
} from '@/constants/jobField';
import type { JobFieldOption } from '@/types/auth';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function jobField(code: string, name: string): JobFieldOption {
  return { code, name, positions: [], techStacks: [] };
}

const BACKEND_JOB_FIELDS = [
  jobField('FRONTEND', '프론트'),
  jobField('BACKEND', '백엔드'),
  jobField('DESIGN', '디자인'),
];

function mockFetchJson(data: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data }),
  } as Response);
  global.fetch = fetchMock;
  return fetchMock;
}

describe('job field labels', () => {
  it('shows one name per field whatever the backend calls it', () => {
    expect(getJobFieldLabel('프론트')).toBe('프론트엔드');
    expect(getJobFieldLabel('프론트엔드')).toBe('프론트엔드');
    expect(getJobFieldLabel('디자이너')).toBe('디자인');
    expect(getJobFieldLabel('PM/기획')).toBe('기획');
    expect(getJobFieldLabel('인프라/운영')).toBe('인프라/운영');
  });

  it('keeps an unknown backend name as is', () => {
    expect(getJobFieldLabel(' 법무 ')).toBe('법무');
  });

  it('labels the contract C3 fields', () => {
    expect(getJobFieldOptionLabel(jobField('MARKETING', '마케팅'))).toBe('마케팅');
    expect(getJobFieldOptionLabel(jobField('DATA', '데이터'))).toBe('데이터');
  });

  it('uses the same field name on project cards and detail', () => {
    expect(formatJobRole('프론트', '웹 프론트엔드')).toBe('프론트엔드(웹 프론트엔드)');
    expect(formatJobRole('디자인', 'UI/UX 디자인')).toBe('디자인(UI/UX 디자인)');
    expect(formatJobRole(null, null)).toBe('-');
  });

  it('resolves the label a dropdown shows back to the backend field', () => {
    const fields = [...BACKEND_JOB_FIELDS, jobField('PLANNING', '기획')];

    expect(findJobFieldOption(fields, getJobFieldOptionLabel(fields[0]))?.code).toBe('FRONTEND');
    expect(findJobFieldOption(fields, '프론트')?.code).toBe('FRONTEND');
    expect(findJobFieldOption(fields, 'PM/기획')?.code).toBe('PLANNING');
    expect(findJobFieldOption(fields, '마케팅')).toBeNull();
  });

  it('resolves a displayed label back to the backend field', () => {
    expect(findProjectJobField(BACKEND_JOB_FIELDS, '프론트엔드')?.code).toBe('FRONTEND');
    expect(findProjectJobField(BACKEND_JOB_FIELDS, '프론트')?.code).toBe('FRONTEND');
    expect(findProjectJobField(BACKEND_JOB_FIELDS, '기획')).toBeNull();
  });
});

describe('job field filter options', () => {
  it('offers only fields the backend returned, plus 전체', () => {
    expect(toJobFieldFilterOptions(BACKEND_JOB_FIELDS)).toEqual([
      { value: '전체', label: '전체' },
      { value: 'DESIGN', label: '디자인' },
      { value: 'FRONTEND', label: '프론트엔드' },
      { value: 'BACKEND', label: '백엔드' },
    ]);
  });

  it('offers 마케팅 and 데이터 once the backend returns them', () => {
    const options = toJobFieldFilterOptions([
      ...BACKEND_JOB_FIELDS,
      jobField('DATA', '데이터'),
      jobField('MARKETING', '마케팅'),
    ]);

    expect(options.slice(-2)).toEqual([
      { value: 'MARKETING', label: '마케팅' },
      { value: 'DATA', label: '데이터' },
    ]);
  });

  it('drops field codes no search endpoint understands', () => {
    const options = toJobFieldFilterOptions([...BACKEND_JOB_FIELDS, jobField('LEGAL', '법무')]);

    expect(options.map((option) => option.label)).not.toContain('법무');
  });
});

describe('project search field filter', () => {
  const filters: ProjectFinderFilters = {
    searchValue: '',
    category: '모든 카테고리',
    recruitOnly: 'all',
    platform: '전체',
    meeting: 'all',
    field: 'DESIGN',
    sort: 'latest',
  };
  const emptySlice = {
    content: [],
    last: true,
    first: true,
    number: 0,
    size: 8,
    numberOfElements: 0,
    empty: true,
  };

  it('sends the selected field code to the backend', async () => {
    const fetchMock = mockFetchJson(emptySlice);

    await fetchProjectSearchResults(filters, 0, 8);

    const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost');
    expect(url.searchParams.get('jobField')).toBe('DESIGN');
  });

  it('sends no field when 전체 is selected', async () => {
    const fetchMock = mockFetchJson(emptySlice);

    await fetchProjectSearchResults({ ...filters, field: '전체' }, 0, 8);

    const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost');
    expect(url.searchParams.has('jobField')).toBe(false);
  });
});

describe('teammate cards', () => {
  it('label a member with the shared field name', async () => {
    mockFetchJson({
      content: [
        {
          memberId: 1,
          name: '김민지',
          profileImageUrl: null,
          jobFieldName: '디자인',
          projectCount: 2,
          techStacks: [],
        },
        {
          memberId: 2,
          name: '이준호',
          profileImageUrl: null,
          jobFieldName: '프론트',
          projectCount: 1,
          techStacks: [],
        },
      ],
      last: true,
      number: 0,
      size: 15,
      empty: false,
    });

    const { teammates } = await fetchTeammates();

    expect(teammates.map((teammate) => teammate.role)).toEqual(['디자인', '프론트엔드']);
  });
});
