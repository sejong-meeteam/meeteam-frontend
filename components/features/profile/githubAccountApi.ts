import type { ApiEnvelope } from '@/types/auth';
import type { GithubAccount } from '@/types/github';

import { API_BASE_URL, apiFetch } from '@/components/features/auth/apiClient';
import { createApiError } from '@/components/features/auth/authError';
import { extractApiData } from '@/components/features/auth/signupTransform';

const ACCOUNT_URL = `${API_BASE_URL}/api/v1/members/me/github`;

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

/** 연결된 GitHub 계정. 연결 전이면 null */
export async function fetchMyGithubAccount(): Promise<GithubAccount | null> {
  const response = await apiFetch(ACCOUNT_URL, { method: 'GET', cache: 'no-store' });

  return readEnvelope<GithubAccount | null>(response, 'GitHub 계정 정보를 불러오지 못했습니다.');
}

/**
 * GitHub OAuth 인가 주소. 사용자가 승인하면 백엔드 콜백이 계정을 저장하고
 * `redirectPath?github=connected`로 돌려보낸다.
 */
export async function fetchGithubAuthorizeUrl(redirectPath: string) {
  const params = new URLSearchParams({ redirectPath });
  const response = await apiFetch(`${ACCOUNT_URL}/authorize-url?${params}`, {
    method: 'GET',
    cache: 'no-store',
  });
  const result = await readEnvelope<{ authorizeUrl: string }>(
    response,
    'GitHub 연결 주소를 받지 못했습니다.',
  );

  return result.authorizeUrl;
}

export async function disconnectMyGithubAccount() {
  const response = await apiFetch(ACCOUNT_URL, { method: 'DELETE' });

  await readEnvelope<null>(response, 'GitHub 계정 연결을 해제하지 못했습니다.');
}
