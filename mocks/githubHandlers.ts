import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import type {
  GithubAccount,
  GithubActivityLevel,
  GithubActivitySummary,
  GithubCollaborator,
  GithubMemberContribution,
  GithubPullRequest,
  GithubRepository,
  GithubReviewState,
  GithubWeeklyReport,
  ProjectGithubActivity,
  ProjectGithubConnection,
  ProjectGithubSettings,
} from '@/types/github';
import { addMockNotification } from './notificationHandlers';
import type { ProjectRecord } from './projectContract';
import { getMembers, getProjects, getSessionMember } from './storage';

type MockRepository = GithubRepository & {
  pushedHoursAgo: number;
  weeklyCommits: number[];
  openIssueCount: number;
  languages: Array<{ name: string; percentage: number }>;
  contributors: Array<{ login: string; commits: number }>;
  pullRequests: Array<{
    number: number;
    title: string;
    authorLogin: string;
    isDraft: boolean;
    reviewState: GithubReviewState;
    createdHoursAgo: number;
    updatedHoursAgo: number;
  }>;
};

type InviteRecord = { status: 'INVITED' | 'ACTIVE' | 'FAILED'; invitedAt: string };

type GithubMockState = {
  accounts: Record<string, GithubAccount>;
  installations: number[];
  links: Record<string, { repositoryId: number; settings: ProjectGithubSettings }>;
  invites: Record<string, InviteRecord>;
};

const STORAGE_KEY = 'meeteam-github';
const HOUR_MS = 3_600_000;
const STALE_PULL_REQUEST_HOURS = 72;
const DEFAULT_SETTINGS: ProjectGithubSettings = {
  autoInviteOnApproval: true,
  autoRevokeOnRemoval: true,
};

const REPOSITORIES: MockRepository[] = [
  {
    id: 9001,
    fullName: 'sejong-meeteam/campus-makers',
    htmlUrl: 'https://github.com/sejong-meeteam/campus-makers',
    description: '세종대 메이커 스페이스 예약과 장비 대여를 한 곳에서',
    isPrivate: false,
    defaultBranch: 'main',
    stars: 24,
    forks: 5,
    pushedHoursAgo: 5,
    weeklyCommits: [3, 5, 8, 6, 9, 12, 10, 14],
    openIssueCount: 7,
    languages: [
      { name: 'TypeScript', percentage: 68.4 },
      { name: 'CSS', percentage: 17.9 },
      { name: 'JavaScript', percentage: 13.7 },
    ],
    contributors: [
      { login: 'minji-dev', commits: 52 },
      { login: 'junho-api', commits: 31 },
      { login: 'sol-design', commits: 8 },
    ],
    pullRequests: [
      {
        number: 48,
        title: '장비 대여 신청 폼 검증 추가',
        authorLogin: 'minji-dev',
        isDraft: false,
        reviewState: 'REVIEW_REQUIRED',
        createdHoursAgo: 20,
        updatedHoursAgo: 6,
      },
      {
        number: 45,
        title: '예약 API 페이지네이션 적용',
        authorLogin: 'junho-api',
        isDraft: false,
        reviewState: 'CHANGES_REQUESTED',
        createdHoursAgo: 70,
        updatedHoursAgo: 30,
      },
      {
        number: 41,
        title: '메인 배너 반응형 레이아웃 개선',
        authorLogin: 'sol-design',
        isDraft: false,
        reviewState: 'REVIEW_REQUIRED',
        createdHoursAgo: 150,
        updatedHoursAgo: 120,
      },
      {
        number: 50,
        title: '[WIP] 관리자 대시보드',
        authorLogin: 'minji-dev',
        isDraft: true,
        reviewState: 'REVIEW_REQUIRED',
        createdHoursAgo: 3,
        updatedHoursAgo: 2,
      },
    ],
  },
  {
    id: 9002,
    fullName: 'sejong-meeteam/study-match',
    htmlUrl: 'https://github.com/sejong-meeteam/study-match',
    description: '관심 과목 기반 스터디 매칭 서비스',
    isPrivate: false,
    defaultBranch: 'main',
    stars: 9,
    forks: 1,
    pushedHoursAgo: 24 * 12,
    weeklyCommits: [9, 7, 6, 4, 3, 2, 1, 0],
    openIssueCount: 3,
    languages: [
      { name: 'Java', percentage: 81.2 },
      { name: 'HTML', percentage: 18.8 },
    ],
    contributors: [{ login: 'junho-api', commits: 40 }],
    pullRequests: [
      {
        number: 12,
        title: '스터디 추천 알고리즘 개선',
        authorLogin: 'junho-api',
        isDraft: false,
        reviewState: 'APPROVED',
        createdHoursAgo: 24 * 13,
        updatedHoursAgo: 24 * 12,
      },
    ],
  },
  {
    id: 9003,
    fullName: 'minji-dev/api-challenge',
    htmlUrl: 'https://github.com/minji-dev/api-challenge',
    description: '캡스톤 API 챌린지 저장소',
    isPrivate: true,
    defaultBranch: 'develop',
    stars: 0,
    forks: 0,
    pushedHoursAgo: 24 * 2,
    weeklyCommits: [0, 0, 1, 2, 4, 3, 6, 5],
    openIssueCount: 4,
    languages: [
      { name: 'Kotlin', percentage: 74.5 },
      { name: 'Dockerfile', percentage: 25.5 },
    ],
    contributors: [{ login: 'minji-dev', commits: 21 }],
    pullRequests: [],
  },
  {
    id: 9004,
    fullName: 'minji-dev/legacy-portfolio',
    htmlUrl: 'https://github.com/minji-dev/legacy-portfolio',
    description: '예전 포트폴리오 사이트',
    isPrivate: false,
    defaultBranch: 'master',
    stars: 2,
    forks: 0,
    pushedHoursAgo: 24 * 200,
    weeklyCommits: [0, 0, 0, 0, 0, 0, 0, 0],
    openIssueCount: 0,
    languages: [{ name: 'HTML', percentage: 100 }],
    contributors: [{ login: 'minji-dev', commits: 14 }],
    pullRequests: [],
  },
];

const PR_TITLE_POOL = [
  '로그인 세션 만료 처리',
  '검색 필터 쿼리 최적화',
  '프로필 이미지 업로드 개선',
  '알림 읽음 처리 API 연동',
  'CI 워크플로 캐시 적용',
  '디자인 토큰 정리',
];
const ISSUE_TITLE_POOL = [
  '모바일에서 버튼이 잘려 보임',
  '회원가입 이메일 중복 확인 누락',
  '목록 정렬 기준 오류',
  '다크 모드 대비 부족',
];

function initialState(): GithubMockState {
  const now = new Date().toISOString();

  return {
    accounts: {
      '1': {
        login: 'minji-dev',
        avatarUrl: '',
        profileUrl: 'https://github.com/minji-dev',
        connectedAt: now,
      },
      '2': {
        login: 'junho-api',
        avatarUrl: '',
        profileUrl: 'https://github.com/junho-api',
        connectedAt: now,
      },
    },
    installations: [101, 102, 103],
    links: {
      '101': { repositoryId: 9001, settings: DEFAULT_SETTINGS },
      '102': { repositoryId: 9002, settings: DEFAULT_SETTINGS },
    },
    invites: {},
  };
}

function readState(): GithubMockState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    return stored ? (JSON.parse(stored) as GithubMockState) : initialState();
  } catch {
    return initialState();
  }
}

function writeState(state: GithubMockState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const success = <T>(result: T) => HttpResponse.json({ code: 'COMMON200', result });
const failure = (status: number, code: string, message: string) =>
  HttpResponse.json({ code, message, result: null }, { status });

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * HOUR_MS).toISOString();
}

function toRepository(repository: MockRepository): GithubRepository {
  return {
    id: repository.id,
    fullName: repository.fullName,
    htmlUrl: repository.htmlUrl,
    description: repository.description,
    isPrivate: repository.isPrivate,
    defaultBranch: repository.defaultBranch,
    stars: repository.stars,
    forks: repository.forks,
  };
}

/** 최근 7일 내 push → ACTIVE, 30일 내 → MODERATE, 그 외 DORMANT */
function activityLevel(pushedHoursAgo: number): GithubActivityLevel {
  if (pushedHoursAgo <= 24 * 7) return 'ACTIVE';
  if (pushedHoursAgo <= 24 * 30) return 'MODERATE';
  return 'DORMANT';
}

function linkedRepository(state: GithubMockState, projectId: number) {
  const link = state.links[String(projectId)];

  return link ? REPOSITORIES.find((item) => item.id === link.repositoryId) : undefined;
}

function projectMemberIds(project: ProjectRecord) {
  return [project.leaderId, ...(project.memberIds ?? []).filter((id) => id !== project.leaderId)];
}

function memberByLogin(state: GithubMockState, login: string) {
  const entry = Object.entries(state.accounts).find(([, account]) => account.login === login);

  if (!entry) return null;

  const member = getMembers().find((item) => item.memberId === Number(entry[0]));

  return member ? { memberId: member.memberId, name: member.name } : null;
}

function findProject(projectId: unknown) {
  return getProjects().find((item) => item.id === Number(projectId));
}

function requireMember(projectId: unknown): ProjectRecord | Response {
  const member = getSessionMember();
  if (!member) return failure(401, 'AUTH401', '로그인이 필요합니다.');
  const project = findProject(projectId);
  if (!project) return failure(404, 'PROJECT404', '프로젝트를 찾을 수 없습니다.');
  return projectMemberIds(project).includes(member.memberId)
    ? project
    : failure(403, 'GITHUB403', '프로젝트 팀원만 볼 수 있어요.');
}

function requireLeader(projectId: unknown): ProjectRecord | Response {
  const member = getSessionMember();
  if (!member) return failure(401, 'AUTH401', '로그인이 필요합니다.');
  const project = findProject(projectId);
  if (!project) return failure(404, 'PROJECT404', '프로젝트를 찾을 수 없습니다.');
  return project.leaderId === member.memberId
    ? project
    : failure(403, 'GITHUB403', '프로젝트 관리 권한이 없습니다.');
}

function connectionOf(state: GithubMockState, projectId: number): ProjectGithubConnection {
  const repository = linkedRepository(state, projectId);

  return {
    isAppInstalled: state.installations.includes(projectId),
    repository: repository ? toRepository(repository) : null,
    settings: state.links[String(projectId)]?.settings ?? DEFAULT_SETTINGS,
  };
}

function contributionsOf(
  state: GithubMockState,
  project: ProjectRecord,
  repository: MockRepository,
  scale = 1,
): GithubMemberContribution[] {
  const members = getMembers();

  return projectMemberIds(project).map((memberId, index) => {
    const login = state.accounts[String(memberId)]?.login ?? null;
    const commits = repository.contributors.find((item) => item.login === login)?.commits ?? 0;

    return {
      memberId,
      name: members.find((item) => item.memberId === memberId)?.name ?? '팀원',
      githubLogin: login,
      commits: Math.round(commits * scale),
      mergedPullRequests: login ? Math.round((commits / 6) * scale) : 0,
      reviews: login ? Math.round(((commits + index * 7) / 5) * scale) : 0,
    };
  });
}

function collaboratorsOf(state: GithubMockState, project: ProjectRecord): GithubCollaborator[] {
  const members = getMembers();
  const settings = state.links[String(project.id)]?.settings ?? DEFAULT_SETTINGS;
  let changed = false;

  const collaborators = projectMemberIds(project).map((memberId): GithubCollaborator => {
    const member = members.find((item) => item.memberId === memberId);
    const account = state.accounts[String(memberId)];
    const isLeader = memberId === project.leaderId;
    const inviteKey = `${project.id}:${memberId}`;
    const base = {
      memberId,
      name: member?.name ?? '팀원',
      profileImageUrl: member?.profileImageUrl ?? '',
      isLeader,
      githubLogin: account?.login ?? null,
    };

    if (!account) {
      return { ...base, accessStatus: 'NO_GITHUB_ACCOUNT', invitedAt: null };
    }

    if (isLeader) {
      return { ...base, accessStatus: 'ACTIVE', invitedAt: null };
    }

    // 실제 백엔드는 지원 승인 시점에 초대를 보낸다. 목에서는 조회 시점에 흉내 낸다.
    if (!state.invites[inviteKey] && settings.autoInviteOnApproval) {
      state.invites[inviteKey] = { status: 'INVITED', invitedAt: new Date().toISOString() };
      changed = true;
    }

    const invite = state.invites[inviteKey];

    return invite
      ? { ...base, accessStatus: invite.status, invitedAt: invite.invitedAt }
      : { ...base, accessStatus: 'NOT_INVITED', invitedAt: null };
  });

  if (changed) writeState(state);

  return collaborators;
}

function seeded(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return () => {
    hash = (hash * 1_103_515_245 + 12_345) >>> 0;
    return hash / 2 ** 32;
  };
}

function weeklyReportOf(
  state: GithubMockState,
  project: ProjectRecord,
  repository: MockRepository,
  weekStart: string,
): GithubWeeklyReport {
  const random = seeded(`${repository.id}:${weekStart}`);
  const [year, month, day] = weekStart.split('-').map(Number);
  const weekEndDate = new Date(year, month - 1, day + 6);
  const weekEnd = `${weekEndDate.getFullYear()}-${String(weekEndDate.getMonth() + 1).padStart(2, '0')}-${String(weekEndDate.getDate()).padStart(2, '0')}`;
  const isDormant = activityLevel(repository.pushedHoursAgo) === 'DORMANT';
  const mergedCount = isDormant ? 0 : Math.floor(random() * 4) + 1;
  const closedCount = isDormant ? 0 : Math.floor(random() * 3);
  const logins = repository.contributors.map((item) => item.login);
  const dayOf = (offset: number) =>
    new Date(year, month - 1, day + offset, 15).toISOString().slice(0, 19);

  return {
    weekStart,
    weekEnd,
    summary: {
      commits: isDormant ? 0 : Math.floor(random() * 20) + 4,
      mergedPullRequests: mergedCount,
      openedIssues: isDormant ? 0 : Math.floor(random() * 4),
      closedIssues: closedCount,
    },
    mergedPullRequests: Array.from({ length: mergedCount }, (_, index) => {
      const authorLogin = logins[index % logins.length];

      return {
        number: 30 + index * 2,
        title: PR_TITLE_POOL[Math.floor(random() * PR_TITLE_POOL.length)],
        url: `${repository.htmlUrl}/pull/${30 + index * 2}`,
        authorLogin,
        authorMemberName: memberByLogin(state, authorLogin)?.name ?? null,
        mergedAt: dayOf(index + 1),
      };
    }),
    closedIssues: Array.from({ length: closedCount }, (_, index) => ({
      number: 60 + index,
      title: ISSUE_TITLE_POOL[Math.floor(random() * ISSUE_TITLE_POOL.length)],
      url: `${repository.htmlUrl}/issues/${60 + index}`,
      closedAt: dayOf(index + 2),
    })),
    contributions: contributionsOf(
      state,
      project,
      repository,
      isDormant ? 0 : 0.2 + random() * 0.2,
    ),
  };
}

/** 프로젝트 카드 목록 응답에 포함되는 요약 정보 */
export function getMockGithubActivitySummary(projectId: number): GithubActivitySummary | null {
  const repository = linkedRepository(readState(), projectId);

  return repository
    ? {
        activityLevel: activityLevel(repository.pushedHoursAgo),
        lastPushedAt: hoursAgo(repository.pushedHoursAgo),
      }
    : null;
}

const settingsSchema = z.object({
  autoInviteOnApproval: z.boolean(),
  autoRevokeOnRemoval: z.boolean(),
});
const linkSchema = z.object({ repositoryId: z.number().int().positive() });
const weekStartSchema = z.iso.date();
const redirectPathSchema = z.string().startsWith('/');

export const githubHandlers = [
  http.get('/api/v1/members/me/github', () => {
    const member = getSessionMember();
    if (!member) return failure(401, 'AUTH401', '로그인이 필요합니다.');
    return success(readState().accounts[String(member.memberId)] ?? null);
  }),
  http.get('/api/v1/members/me/github/authorize-url', ({ request }) => {
    const member = getSessionMember();
    if (!member) return failure(401, 'AUTH401', '로그인이 필요합니다.');
    const redirectPath = redirectPathSchema.safeParse(
      new URL(request.url).searchParams.get('redirectPath'),
    );
    if (!redirectPath.success) return failure(400, 'GITHUB400', '잘못된 이동 경로입니다.');

    // 목에서는 OAuth 승인까지 끝난 것으로 보고 바로 계정을 저장한다.
    const state = readState();
    const login = member.email.split('@')[0] || `meeteam-${member.memberId}`;
    state.accounts[String(member.memberId)] = {
      login,
      avatarUrl: '',
      profileUrl: `https://github.com/${login}`,
      connectedAt: new Date().toISOString(),
    };
    writeState(state);
    return success({ authorizeUrl: `${redirectPath.data}?github=connected` });
  }),
  http.delete('/api/v1/members/me/github', () => {
    const member = getSessionMember();
    if (!member) return failure(401, 'AUTH401', '로그인이 필요합니다.');
    const state = readState();
    delete state.accounts[String(member.memberId)];
    writeState(state);
    return success(null);
  }),

  http.get('/api/v1/projects/:projectId/github/activity', ({ params }) => {
    const project = findProject(params.projectId);
    if (!project) return failure(404, 'PROJECT404', '프로젝트를 찾을 수 없습니다.');
    const state = readState();
    const repository = linkedRepository(state, project.id);
    if (!repository) return success(null);

    const viewer = getSessionMember();
    const isMember = viewer ? projectMemberIds(project).includes(viewer.memberId) : false;
    const hideDetails = repository.isPrivate && !isMember;
    const activity: ProjectGithubActivity = {
      repository: toRepository(repository),
      activityLevel: activityLevel(repository.pushedHoursAgo),
      lastPushedAt: hoursAgo(repository.pushedHoursAgo),
      weeklyCommits: repository.weeklyCommits,
      openPullRequestCount: repository.pullRequests.length,
      openIssueCount: repository.openIssueCount,
      languages: repository.languages,
      contributors: hideDetails
        ? []
        : repository.contributors.map((item) => {
            const member = memberByLogin(state, item.login);
            return {
              login: item.login,
              avatarUrl: '',
              commits: item.commits,
              memberId: member?.memberId ?? null,
              memberName: member?.name ?? null,
            };
          }),
      syncedAt: hoursAgo(0.2),
    };
    return success(activity);
  }),
  http.get('/api/v1/projects/:projectId/github/progress', ({ params }) => {
    const project = requireMember(params.projectId);
    if (project instanceof Response) return project;
    const state = readState();
    const repository = linkedRepository(state, project.id);
    if (!repository)
      return failure(404, 'GITHUB_REPOSITORY_NOT_LINKED', '연결된 저장소가 없습니다.');

    const pullRequests: GithubPullRequest[] = repository.pullRequests.map((item) => ({
      number: item.number,
      title: item.title,
      url: `${repository.htmlUrl}/pull/${item.number}`,
      authorLogin: item.authorLogin,
      authorMemberName: memberByLogin(state, item.authorLogin)?.name ?? null,
      isDraft: item.isDraft,
      reviewState: item.reviewState,
      createdAt: hoursAgo(item.createdHoursAgo),
      updatedAt: hoursAgo(item.updatedHoursAgo),
      isStale:
        !item.isDraft &&
        item.reviewState !== 'APPROVED' &&
        item.updatedHoursAgo >= STALE_PULL_REQUEST_HOURS,
    }));
    return success({
      periodStart: hoursAgo(24 * 28).slice(0, 10),
      periodEnd: hoursAgo(0).slice(0, 10),
      pullRequests,
      contributions: contributionsOf(state, project, repository),
    });
  }),
  http.get('/api/v1/projects/:projectId/github/weekly-report', ({ params, request }) => {
    const project = requireMember(params.projectId);
    if (project instanceof Response) return project;
    const weekStart = weekStartSchema.safeParse(new URL(request.url).searchParams.get('weekStart'));
    if (!weekStart.success) return failure(400, 'GITHUB400', 'weekStart 형식이 올바르지 않습니다.');
    const state = readState();
    const repository = linkedRepository(state, project.id);
    if (!repository)
      return failure(404, 'GITHUB_REPOSITORY_NOT_LINKED', '연결된 저장소가 없습니다.');
    if (weekStart.data > new Date().toISOString().slice(0, 10))
      return failure(400, 'GITHUB400', '아직 시작하지 않은 주입니다.');
    return success(weeklyReportOf(state, project, repository, weekStart.data));
  }),

  http.get('/api/v1/projects/:projectId/github', ({ params }) => {
    const project = requireLeader(params.projectId);
    if (project instanceof Response) return project;
    return success(connectionOf(readState(), project.id));
  }),
  http.get('/api/v1/projects/:projectId/github/install-url', ({ params }) => {
    const project = requireLeader(params.projectId);
    if (project instanceof Response) return project;
    // 목에서는 설치가 끝난 것으로 보고 설치 완료 콜백 경로를 바로 돌려준다.
    const state = readState();
    if (!state.installations.includes(project.id)) state.installations.push(project.id);
    writeState(state);
    return success({ installUrl: `/projects/${project.id}/manage/github?installed=1` });
  }),
  http.get('/api/v1/projects/:projectId/github/repositories', ({ params }) => {
    const project = requireLeader(params.projectId);
    if (project instanceof Response) return project;
    const state = readState();
    if (!state.installations.includes(project.id))
      return failure(409, 'GITHUB_APP_NOT_INSTALLED', '먼저 GitHub App을 설치해주세요.');
    const linkedElsewhere = Object.entries(state.links)
      .filter(([projectId]) => Number(projectId) !== project.id)
      .map(([, link]) => link.repositoryId);
    return success(
      REPOSITORIES.filter((item) => !linkedElsewhere.includes(item.id)).map(toRepository),
    );
  }),
  http.put('/api/v1/projects/:projectId/github/repository', async ({ params, request }) => {
    const project = requireLeader(params.projectId);
    if (project instanceof Response) return project;
    const body = linkSchema.safeParse(await request.json().catch(() => null));
    if (!body.success) return failure(400, 'GITHUB400', '저장소를 선택해주세요.');
    const state = readState();
    if (!state.installations.includes(project.id))
      return failure(409, 'GITHUB_APP_NOT_INSTALLED', '먼저 GitHub App을 설치해주세요.');
    if (!REPOSITORIES.some((item) => item.id === body.data.repositoryId))
      return failure(404, 'GITHUB404', '저장소를 찾을 수 없습니다.');
    const takenBy = Object.entries(state.links).find(
      ([projectId, link]) =>
        Number(projectId) !== project.id && link.repositoryId === body.data.repositoryId,
    );
    if (takenBy)
      return failure(409, 'GITHUB_REPOSITORY_TAKEN', '다른 프로젝트에 연결된 저장소입니다.');
    state.links[String(project.id)] = {
      repositoryId: body.data.repositoryId,
      settings: state.links[String(project.id)]?.settings ?? DEFAULT_SETTINGS,
    };
    writeState(state);
    return success(connectionOf(state, project.id));
  }),
  http.delete('/api/v1/projects/:projectId/github/repository', ({ params }) => {
    const project = requireLeader(params.projectId);
    if (project instanceof Response) return project;
    const state = readState();
    delete state.links[String(project.id)];
    writeState(state);
    return success(connectionOf(state, project.id));
  }),
  http.patch('/api/v1/projects/:projectId/github/settings', async ({ params, request }) => {
    const project = requireLeader(params.projectId);
    if (project instanceof Response) return project;
    const body = settingsSchema.safeParse(await request.json().catch(() => null));
    if (!body.success) return failure(400, 'GITHUB400', '설정 값이 올바르지 않습니다.');
    const state = readState();
    const link = state.links[String(project.id)];
    if (!link) return failure(404, 'GITHUB_REPOSITORY_NOT_LINKED', '연결된 저장소가 없습니다.');
    state.links[String(project.id)] = { ...link, settings: body.data };
    writeState(state);
    return success(body.data);
  }),
  http.get('/api/v1/projects/:projectId/github/collaborators', ({ params }) => {
    const project = requireLeader(params.projectId);
    if (project instanceof Response) return project;
    const state = readState();
    if (!state.links[String(project.id)])
      return failure(404, 'GITHUB_REPOSITORY_NOT_LINKED', '연결된 저장소가 없습니다.');
    return success(collaboratorsOf(state, project));
  }),
  http.post('/api/v1/projects/:projectId/github/collaborators/:memberId/invite', ({ params }) => {
    const project = requireLeader(params.projectId);
    if (project instanceof Response) return project;
    const state = readState();
    if (!state.links[String(project.id)])
      return failure(404, 'GITHUB_REPOSITORY_NOT_LINKED', '연결된 저장소가 없습니다.');
    const memberId = Number(params.memberId);
    if (!projectMemberIds(project).includes(memberId) || memberId === project.leaderId)
      return failure(400, 'GITHUB400', '초대할 수 없는 팀원입니다.');
    if (!state.accounts[String(memberId)])
      return failure(409, 'GITHUB_ACCOUNT_NOT_LINKED', '팀원이 GitHub 계정을 연결하지 않았습니다.');
    state.invites[`${project.id}:${memberId}`] = {
      status: 'INVITED',
      invitedAt: new Date().toISOString(),
    };
    writeState(state);
    addMockNotification(memberId, 'GITHUB_REPO_INVITED', project.id, project.name);
    const collaborator = collaboratorsOf(state, project).find((item) => item.memberId === memberId);
    return success(collaborator);
  }),
];
