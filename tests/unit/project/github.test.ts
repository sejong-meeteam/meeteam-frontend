import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from '@/mocks/handlers';
import { getMockNotifications } from '@/mocks/notificationHandlers';
import { replaceMockProject } from '@/mocks/projectManagementHandlers';
import { getProjects, setSession } from '@/mocks/storage';
import * as githubApi from '@/components/features/project/github/githubApi';
import {
  buildWeeklyReportMarkdown,
  getWeekEnd,
  getWeekStart,
  shiftWeek,
} from '@/components/features/project/github/githubFormat';
import { fetchProjectSearchResults } from '@/components/features/project/find/projectFindApi';
import {
  disconnectMyGithubAccount,
  fetchGithubAuthorizeUrl,
  fetchMyGithubAccount,
} from '@/components/features/profile/githubAccountApi';
import type { GithubWeeklyReport } from '@/types/github';

const server = setupServer(...handlers);
const nativeFetch = globalThis.fetch;
const stored = new Map<string, string>();

beforeAll(() => {
  vi.stubGlobal('location', new URL('http://localhost:3000'));
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
    removeItem: (key: string) => stored.delete(key),
  });
  server.listen({ onUnhandledRequest: 'error' });
  const intercepted = globalThis.fetch;
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
    intercepted(typeof input === 'string' ? new URL(input, 'http://localhost:3000') : input, init),
  );
});
beforeEach(() => {
  stored.clear();
  setSession(1);
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
  globalThis.fetch = nativeFetch;
});

function addMember(projectId: number, memberId: number) {
  const project = getProjects().find((item) => item.id === projectId)!;
  replaceMockProject({ ...project, memberIds: [project.leaderId, memberId] });
}

describe('GitHub 연동 - 공개 개발 현황', () => {
  it('연결된 저장소의 활동 정보를 누구나 볼 수 있다', async () => {
    const activity = await githubApi.fetchProjectGithubActivity(101);

    expect(activity).toMatchObject({
      activityLevel: 'ACTIVE',
      repository: { fullName: 'sejong-meeteam/campus-makers' },
    });
    expect(activity?.weeklyCommits).toHaveLength(8);
    expect(activity?.contributors.find((item) => item.login === 'minji-dev')?.memberName).toBe(
      '김민지',
    );
  });

  it('저장소가 없는 프로젝트는 null을 반환한다', async () => {
    await expect(githubApi.fetchProjectGithubActivity(104)).resolves.toBeNull();
  });

  it('프로젝트 카드 목록에 활동 수준이 포함된다', async () => {
    const { projects } = await fetchProjectSearchResults(
      {
        searchValue: '',
        category: '모든 카테고리',
        recruitOnly: 'all',
        platform: '전체',
        field: '전체',
        sort: 'latest',
      },
      0,
      20,
    );

    expect(projects.find((item) => item.id === 101)?.githubActivityLevel).toBe('ACTIVE');
    expect(projects.find((item) => item.id === 102)?.githubActivityLevel).toBe('MODERATE');
    expect(projects.find((item) => item.id === 104)?.githubActivityLevel).toBeNull();
  });
});

describe('GitHub 연동 - 팀원 전용 정보', () => {
  it('팀원은 PR 진행 현황과 주간 리포트를 볼 수 있다', async () => {
    const progress = await githubApi.fetchProjectGithubProgress(101);

    expect(progress.pullRequests.some((item) => item.isStale)).toBe(true);
    expect(progress.pullRequests.find((item) => item.isDraft)?.isStale).toBe(false);
    expect(progress.contributions[0]).toMatchObject({ memberId: 1, githubLogin: 'minji-dev' });

    const weekStart = shiftWeek(getWeekStart(), -1);
    const report = await githubApi.fetchProjectGithubWeeklyReport(101, weekStart);

    expect(report.weekStart).toBe(weekStart);
    expect(report.mergedPullRequests).toHaveLength(report.summary.mergedPullRequests);
  });

  it('팀원이 아니면 진행 현황을 볼 수 없다', async () => {
    await expect(githubApi.fetchProjectGithubProgress(102)).rejects.toThrow(
      '프로젝트 팀원만 볼 수 있어요.',
    );
  });
});

describe('GitHub 연동 - 리더 관리', () => {
  it('설치된 GitHub App으로 저장소를 연결하고 해제한다', async () => {
    const before = await githubApi.fetchProjectGithubConnection(103);
    expect(before).toMatchObject({ isAppInstalled: true, repository: null });

    const repositories = await githubApi.fetchInstallableGithubRepositories(103);
    expect(repositories.map((item) => item.id)).not.toContain(9001);

    const linked = await githubApi.linkProjectGithubRepository(103, 9003);
    expect(linked.repository?.fullName).toBe('minji-dev/api-challenge');
    await expect(githubApi.fetchProjectGithubActivity(103)).resolves.toMatchObject({
      repository: { isPrivate: true },
    });

    await expect(
      githubApi.updateProjectGithubSettings(103, {
        autoInviteOnApproval: false,
        autoRevokeOnRemoval: true,
      }),
    ).resolves.toEqual({ autoInviteOnApproval: false, autoRevokeOnRemoval: true });

    const unlinked = await githubApi.unlinkProjectGithubRepository(103);
    expect(unlinked.repository).toBeNull();
  });

  it('다른 프로젝트에 연결된 저장소는 연결할 수 없다', async () => {
    await expect(githubApi.linkProjectGithubRepository(103, 9002)).rejects.toThrow(
      '다른 프로젝트에 연결된 저장소입니다.',
    );
  });

  it('리더가 아니면 연동 설정에 접근할 수 없다', async () => {
    await expect(githubApi.fetchProjectGithubConnection(102)).rejects.toThrow(
      '프로젝트 관리 권한이 없습니다.',
    );
  });

  it('자동 초대가 꺼져 있으면 팀원을 직접 초대하고 알림을 보낸다', async () => {
    addMember(101, 2);
    await githubApi.updateProjectGithubSettings(101, {
      autoInviteOnApproval: false,
      autoRevokeOnRemoval: true,
    });

    const collaborators = await githubApi.fetchProjectGithubCollaborators(101);
    expect(collaborators.find((item) => item.memberId === 1)?.accessStatus).toBe('ACTIVE');
    expect(collaborators.find((item) => item.memberId === 2)?.accessStatus).toBe('NOT_INVITED');

    const invited = await githubApi.inviteProjectGithubCollaborator(101, 2);
    expect(invited).toMatchObject({ accessStatus: 'INVITED', githubLogin: 'junho-api' });
    expect(
      getMockNotifications().some(
        (item) => item.receiverId === 2 && item.type === 'GITHUB_REPO_INVITED',
      ),
    ).toBe(true);
  });

  it('자동 초대가 켜져 있으면 합류한 팀원이 바로 초대 상태가 된다', async () => {
    addMember(101, 2);

    const collaborators = await githubApi.fetchProjectGithubCollaborators(101);
    expect(collaborators.find((item) => item.memberId === 2)?.accessStatus).toBe('INVITED');
  });
});

describe('GitHub 계정 연결', () => {
  it('계정 연결 상태를 조회하고 해제 후 다시 연결한다', async () => {
    await expect(fetchMyGithubAccount()).resolves.toMatchObject({ login: 'minji-dev' });

    await disconnectMyGithubAccount();
    await expect(fetchMyGithubAccount()).resolves.toBeNull();

    await expect(fetchGithubAuthorizeUrl('/settings')).resolves.toBe('/settings?github=connected');
    await expect(fetchMyGithubAccount()).resolves.not.toBeNull();
  });
});

describe('주간 리포트 포맷', () => {
  it('주의 시작(월요일)과 끝(일요일)을 계산한다', () => {
    expect(getWeekStart(new Date(2026, 10, 5))).toBe('2026-11-02');
    expect(getWeekStart(new Date(2026, 10, 8))).toBe('2026-11-02');
    expect(getWeekEnd('2026-11-02')).toBe('2026-11-08');
    expect(shiftWeek('2026-11-02', -1)).toBe('2026-10-26');
  });

  it('보고서용 마크다운을 만든다', () => {
    const report: GithubWeeklyReport = {
      weekStart: '2026-11-02',
      weekEnd: '2026-11-08',
      summary: { commits: 12, mergedPullRequests: 1, openedIssues: 2, closedIssues: 0 },
      mergedPullRequests: [
        {
          number: 7,
          title: '로그인 구현',
          url: 'https://github.com/a/b/pull/7',
          authorLogin: 'minji-dev',
          authorMemberName: '김민지',
          mergedAt: '2026-11-04T10:00:00',
        },
      ],
      closedIssues: [],
      contributions: [
        {
          memberId: 1,
          name: '김민지',
          githubLogin: 'minji-dev',
          commits: 12,
          mergedPullRequests: 1,
          reviews: 3,
        },
      ],
    };

    const markdown = buildWeeklyReportMarkdown('캠퍼스 메이커스', report);

    expect(markdown).toContain('# 캠퍼스 메이커스 주간 개발 리포트 (2026-11-02 ~ 2026-11-08)');
    expect(markdown).toContain('- #7 로그인 구현 (김민지, 11/4)');
    expect(markdown).toContain('## 닫힌 이슈\n- 없음');
    expect(markdown).toContain('| 김민지 | 12 | 1 | 3 |');
  });
});
