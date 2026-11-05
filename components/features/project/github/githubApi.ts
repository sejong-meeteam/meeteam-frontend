import type { ApiEnvelope } from '@/types/auth';
import type {
  GithubCollaborator,
  GithubRepository,
  GithubWeeklyReport,
  ProjectGithubActivity,
  ProjectGithubConnection,
  ProjectGithubProgress,
  ProjectGithubSettings,
} from '@/types/github';

import { API_BASE_URL, apiFetch } from '@/components/features/auth/apiClient';
import { createApiError } from '@/components/features/auth/authError';
import { extractApiData } from '@/components/features/auth/signupTransform';

async function readEnvelope<T>(response: Response, fallbackMessage: string) {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    throw createApiError(response, payload, fallbackMessage);
  }

  if (!payload) {
    throw new Error('응답 형식을 해석할 수 없습니다.');
  }

  return extractApiData(payload);
}

function githubUrl(projectId: string | number, path = '') {
  return `${API_BASE_URL}/api/v1/projects/${projectId}/github${path}`;
}

function jsonInit(method: string, body?: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}

/** 공개 개발 현황. 저장소가 연결되지 않았으면 null을 반환한다. */
export async function fetchProjectGithubActivity(
  projectId: string | number,
): Promise<ProjectGithubActivity | null> {
  const response = await apiFetch(githubUrl(projectId, '/activity'), {
    method: 'GET',
    cache: 'no-store',
  });

  return readEnvelope<ProjectGithubActivity | null>(response, '개발 현황을 불러오지 못했습니다.');
}

/** 팀원 전용 진행 현황 (열린 PR, 팀원별 기여도) */
export async function fetchProjectGithubProgress(
  projectId: string | number,
): Promise<ProjectGithubProgress> {
  const response = await apiFetch(githubUrl(projectId, '/progress'), {
    method: 'GET',
    cache: 'no-store',
  });

  return readEnvelope<ProjectGithubProgress>(response, '팀 진행 현황을 불러오지 못했습니다.');
}

export async function fetchProjectGithubWeeklyReport(
  projectId: string | number,
  weekStart: string,
): Promise<GithubWeeklyReport> {
  const params = new URLSearchParams({ weekStart });
  const response = await apiFetch(githubUrl(projectId, `/weekly-report?${params}`), {
    method: 'GET',
    cache: 'no-store',
  });

  return readEnvelope<GithubWeeklyReport>(response, '주간 리포트를 불러오지 못했습니다.');
}

export async function fetchProjectGithubConnection(
  projectId: string | number,
): Promise<ProjectGithubConnection> {
  const response = await apiFetch(githubUrl(projectId), { method: 'GET', cache: 'no-store' });

  return readEnvelope<ProjectGithubConnection>(response, 'GitHub 연동 정보를 불러오지 못했습니다.');
}

/** GitHub App 설치 페이지 주소. 설치가 끝나면 백엔드가 관리 화면으로 리다이렉트한다. */
export async function fetchGithubAppInstallUrl(projectId: string | number) {
  const response = await apiFetch(githubUrl(projectId, '/install-url'), {
    method: 'GET',
    cache: 'no-store',
  });
  const result = await readEnvelope<{ installUrl: string }>(
    response,
    'GitHub App 설치 주소를 받지 못했습니다.',
  );

  return result.installUrl;
}

export async function fetchInstallableGithubRepositories(
  projectId: string | number,
): Promise<GithubRepository[]> {
  const response = await apiFetch(githubUrl(projectId, '/repositories'), {
    method: 'GET',
    cache: 'no-store',
  });

  return readEnvelope<GithubRepository[]>(response, '연결 가능한 저장소를 불러오지 못했습니다.');
}

export async function linkProjectGithubRepository(
  projectId: string | number,
  repositoryId: number,
): Promise<ProjectGithubConnection> {
  const response = await apiFetch(
    githubUrl(projectId, '/repository'),
    jsonInit('PUT', { repositoryId }),
  );

  return readEnvelope<ProjectGithubConnection>(response, '저장소를 연결하지 못했습니다.');
}

export async function unlinkProjectGithubRepository(
  projectId: string | number,
): Promise<ProjectGithubConnection> {
  const response = await apiFetch(githubUrl(projectId, '/repository'), { method: 'DELETE' });

  return readEnvelope<ProjectGithubConnection>(response, '저장소 연결을 해제하지 못했습니다.');
}

export async function updateProjectGithubSettings(
  projectId: string | number,
  settings: ProjectGithubSettings,
): Promise<ProjectGithubSettings> {
  const response = await apiFetch(githubUrl(projectId, '/settings'), jsonInit('PATCH', settings));

  return readEnvelope<ProjectGithubSettings>(response, '연동 설정을 저장하지 못했습니다.');
}

export async function fetchProjectGithubCollaborators(
  projectId: string | number,
): Promise<GithubCollaborator[]> {
  const response = await apiFetch(githubUrl(projectId, '/collaborators'), {
    method: 'GET',
    cache: 'no-store',
  });
  const collaborators = await readEnvelope<GithubCollaborator[]>(
    response,
    '저장소 접근 현황을 불러오지 못했습니다.',
  );

  return collaborators.map((item) => ({ ...item, profileImageUrl: item.profileImageUrl ?? '' }));
}

export async function inviteProjectGithubCollaborator(
  projectId: string | number,
  memberId: number,
): Promise<GithubCollaborator> {
  const response = await apiFetch(
    githubUrl(projectId, `/collaborators/${memberId}/invite`),
    jsonInit('POST'),
  );
  const collaborator = await readEnvelope<GithubCollaborator>(
    response,
    '저장소 초대를 보내지 못했습니다.',
  );

  return { ...collaborator, profileImageUrl: collaborator.profileImageUrl ?? '' };
}
