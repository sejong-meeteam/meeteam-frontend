import type { ApiEnvelope } from '@/types/auth';
import type { ProjectProposal, ProjectProposalRequest, ProposableProject } from '@/types/proposal';

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

/** 내가 리더인 모집 중 프로젝트와 열린 포지션. 이 회원에게 보낸 대기 중 제안 여부를 함께 준다. */
export async function fetchProposableProjects(memberId: number): Promise<ProposableProject[]> {
  const response = await apiFetch(
    `${API_BASE_URL}/api/v1/members/${memberId}/proposable-projects`,
    { method: 'GET', cache: 'no-store' },
  );

  return readEnvelope<ProposableProject[]>(response, '제안할 프로젝트를 불러오지 못했습니다.');
}

export async function sendProjectProposal(
  projectId: number,
  request: ProjectProposalRequest,
): Promise<ProjectProposal> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/projects/${projectId}/proposals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  return readEnvelope<ProjectProposal>(response, '제안을 보내지 못했습니다.');
}
