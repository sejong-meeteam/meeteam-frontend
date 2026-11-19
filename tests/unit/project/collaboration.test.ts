import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from '@/mocks/handlers';
import { JOB_OPTIONS } from '@/mocks/fixtures';
import { setSession } from '@/mocks/storage';
import { parseProjectCollaboration } from '@/components/features/project/collaboration';
import { collaborationInputSchema } from '@/components/features/project/create/schema';
import { fetchProjectSearchResults } from '@/components/features/project/find/projectFindApi';
import type { ProjectFinderFilters } from '@/components/features/project/find/types';
import * as projectApi from '@/components/features/project/projectApi';
import type { ProjectFormValues } from '@/types/project';

const server = setupServer(...handlers);
const nativeFetch = globalThis.fetch;
const stored = new Map<string, string>();
const requestedUrls: URL[] = [];

beforeAll(() => {
  vi.stubGlobal('location', new URL('http://localhost:3000'));
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
    removeItem: (key: string) => stored.delete(key),
  });
  server.listen({ onUnhandledRequest: 'error' });
  server.events.on('request:start', ({ request }) => requestedUrls.push(new URL(request.url)));
  const intercepted = globalThis.fetch;
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
    intercepted(typeof input === 'string' ? new URL(input, 'http://localhost:3000') : input, init),
  );
});
beforeEach(() => {
  stored.clear();
  requestedUrls.length = 0;
  setSession(1);
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
  globalThis.fetch = nativeFetch;
});

const frontendField = JOB_OPTIONS.fields.find((field) => field.code === 'FRONTEND')!;
const backendField = JOB_OPTIONS.fields.find((field) => field.code === 'BACKEND')!;

const FORM_VALUES: ProjectFormValues = {
  projectName: '원거리 통학생 프로젝트',
  githubUrl: '',
  communicationUrl: '',
  categoryId: 'study',
  description: '회의 방식과 시간 부담을 미리 알려주는 프로젝트입니다.',
  releasePlatforms: ['웹'],
  myInterest: { major: frontendField.name, minor: frontendField.positions[0].name },
  recruitInterests: [{ major: backendField.name, minor: backendField.positions[0].name, count: 1 }],
  recruitTechStacks: {
    [`${backendField.name} - ${backendField.positions[0].name}`]: [backendField.techStacks[0].name],
  },
  recruitDeadline: '',
  isRecruitUntilComplete: true,
  coverImage: null,
  meetingMode: 'ONLINE',
  weeklyHours: 6,
  meetingNote: '  화요일 저녁 7시 디스코드  ',
};

const ALL_FILTERS: ProjectFinderFilters = {
  searchValue: '',
  category: '모든 카테고리',
  recruitOnly: 'all',
  platform: '전체',
  meeting: 'all',
  field: '전체',
  sort: 'latest',
};

describe('collaborationInputSchema', () => {
  it.each([
    ['', null],
    ['1', 1],
    [' 40 ', 40],
  ])('주당 예상 시간 %j를 %j로 받는다', (weeklyHours, expected) => {
    expect(collaborationInputSchema.parse({ weeklyHours }).weeklyHours).toBe(expected);
  });

  it.each(['0', '41', '6.5', '-3', 'abc'])('주당 예상 시간 %j는 거절한다', (weeklyHours) => {
    const result = collaborationInputSchema.safeParse({ weeklyHours });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      '주당 예상 시간은 1~40시간 사이로 입력해 주세요.',
    );
  });

  it('회의 메모는 100자까지 받고 빈 값은 null로 바꾼다', () => {
    expect(
      collaborationInputSchema.parse({ meetingNote: 'a'.repeat(100) }).meetingNote,
    ).toHaveLength(100);
    expect(collaborationInputSchema.parse({ meetingNote: '   ' }).meetingNote).toBeNull();
    expect(collaborationInputSchema.safeParse({ meetingNote: 'a'.repeat(101) }).success).toBe(
      false,
    );
  });

  it('아무것도 입력하지 않으면 모두 null이다', () => {
    expect(collaborationInputSchema.parse({})).toEqual({
      meetingMode: null,
      weeklyHours: null,
      meetingNote: null,
    });
  });
});

describe('parseProjectCollaboration', () => {
  it('기존 프로젝트처럼 필드가 없거나 잘못된 값이면 null로 숨긴다', () => {
    expect(parseProjectCollaboration({})).toEqual({
      meetingMode: null,
      weeklyHours: null,
      meetingNote: null,
    });
    expect(
      parseProjectCollaboration({ meetingMode: 'REMOTE', weeklyHours: 99, meetingNote: '  ' }),
    ).toEqual({ meetingMode: null, weeklyHours: null, meetingNote: null });
  });
});

describe('project request mapping', () => {
  it('등록 payload에 회의 방식, 주당 시간, 다듬은 메모를 담는다', () => {
    expect(projectApi.buildProjectCreatePayload(FORM_VALUES, JOB_OPTIONS.fields)).toMatchObject({
      projectCategory: 'STUDY',
      meetingMode: 'ONLINE',
      weeklyHours: 6,
      meetingNote: '화요일 저녁 7시 디스코드',
    });
  });

  it('수정 payload는 비운 값을 null로 보내 기존 값을 지운다', () => {
    expect(
      projectApi.buildProjectEditPayload(
        {
          ...FORM_VALUES,
          categoryId: 'contest',
          meetingMode: null,
          weeklyHours: null,
          meetingNote: null,
        },
        JOB_OPTIONS.fields,
      ),
    ).toMatchObject({
      projectCategory: 'CONTEST',
      meetingMode: null,
      weeklyHours: null,
      meetingNote: null,
    });
  });
});

describe('MSW collaboration flow', () => {
  it('등록한 협업 정보가 상세·수정·목록에 나오고 수정으로 지울 수 있다', async () => {
    const { id } = await projectApi.createProject(
      projectApi.buildProjectCreatePayload(FORM_VALUES, JOB_OPTIONS.fields),
    );

    const detail = await projectApi.fetchProjectDetail(id);
    expect(detail).toMatchObject({
      categoryId: 'study',
      meetingMode: 'ONLINE',
      weeklyHours: 6,
      meetingNote: '화요일 저녁 7시 디스코드',
    });

    const card = (await fetchProjectSearchResults(ALL_FILTERS, 0, 20)).projects.find(
      (project) => project.id === id,
    );
    expect(card).toMatchObject({ category: '스터디', meetingMode: 'ONLINE', weeklyHours: 6 });

    const prefill = await projectApi.fetchProjectEditPrefill(id);
    expect(prefill.values).toMatchObject({ meetingMode: 'ONLINE', weeklyHours: 6 });

    await projectApi.updateProject(
      id,
      projectApi.buildProjectEditPayload(
        { ...prefill.values, meetingMode: 'HYBRID', weeklyHours: null, meetingNote: null },
        JOB_OPTIONS.fields,
      ),
    );
    expect(await projectApi.fetchProjectDetail(id)).toMatchObject({
      meetingMode: 'HYBRID',
      weeklyHours: null,
      meetingNote: null,
    });
  });

  it('온라인 가능 필터는 meetingMode=ONLINE을 보내고 온라인·병행 프로젝트만 받는다', async () => {
    const { projects } = await fetchProjectSearchResults(
      { ...ALL_FILTERS, meeting: 'online' },
      0,
      20,
    );

    const searchUrl = requestedUrls.find((url) => url.pathname === '/api/v1/projects/search');
    expect(searchUrl?.searchParams.get('meetingMode')).toBe('ONLINE');
    expect(projects.length).toBeGreaterThan(0);
    expect(new Set(projects.map((project) => project.meetingMode))).toEqual(
      new Set(['ONLINE', 'HYBRID']),
    );
  });

  it('필터를 고르지 않으면 meetingMode를 보내지 않고 미정 프로젝트도 받는다', async () => {
    const { projects } = await fetchProjectSearchResults(ALL_FILTERS, 0, 20);

    const searchUrl = requestedUrls.find((url) => url.pathname === '/api/v1/projects/search');
    expect(searchUrl?.searchParams.has('meetingMode')).toBe(false);
    expect(projects.some((project) => project.meetingMode === null)).toBe(true);
    expect(projects.some((project) => project.meetingMode === 'OFFLINE')).toBe(true);
  });
});
