import type { ApiEnvelope, MemberRole } from '@/types/auth';
import type {
  AdminDashboard,
  AdminMemberDetail,
  AdminMemberSummary,
  AdminPage,
  AdminProjectDetail,
  AdminProjectSummary,
  AuditLog,
  AuditTargetType,
  ProjectVisibility,
} from '@/types/admin';

import { API_BASE_URL, apiFetch } from '@/components/features/auth/apiClient';
import { createApiError } from '@/components/features/auth/authError';
import { extractApiData } from '@/components/features/auth/signupTransform';
import {
  ADMIN_PAGE_SIZE,
  type AuditLogFilters,
  type MemberFilters,
  type ProjectFilters,
  type SuspendMemberRequest,
} from './schema';

const ADMIN_API = `${API_BASE_URL}/api/v1/admin`;

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`${ADMIN_API}${path}`, {
    cache: 'no-store',
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    throw createApiError(response, payload, '관리자 요청을 처리하지 못했습니다.');
  }
  if (!payload) {
    throw new Error('응답 형식을 해석할 수 없습니다.');
  }
  return extractApiData(payload);
}

function toQuery(params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) search.set(key, String(value));
  });
  return search.toString();
}

function sendJson(method: 'POST' | 'PATCH', body: unknown): RequestInit {
  return { method, body: JSON.stringify(body) };
}

export function fetchAdminDashboard(signal?: AbortSignal) {
  return adminRequest<AdminDashboard>('/dashboard', { signal });
}

export function fetchAdminMembers(filters: MemberFilters, signal?: AbortSignal) {
  return adminRequest<AdminPage<AdminMemberSummary>>(
    `/members?${toQuery({ ...filters, size: ADMIN_PAGE_SIZE })}`,
    { signal },
  );
}

export function fetchAdminMember(memberId: number, signal?: AbortSignal) {
  return adminRequest<AdminMemberDetail>(`/members/${memberId}`, { signal });
}

export function suspendAdminMember(memberId: number, request: SuspendMemberRequest) {
  return adminRequest<AdminMemberSummary>(
    `/members/${memberId}/suspend`,
    sendJson('POST', request),
  );
}

export function unsuspendAdminMember(memberId: number, reason: string) {
  return adminRequest<AdminMemberSummary>(
    `/members/${memberId}/unsuspend`,
    sendJson('POST', { reason }),
  );
}

export function changeAdminMemberRole(memberId: number, role: MemberRole, reason: string) {
  return adminRequest<AdminMemberSummary>(
    `/members/${memberId}/role`,
    sendJson('PATCH', { role, reason }),
  );
}

export function withdrawAdminMember(memberId: number, reason: string) {
  return adminRequest<AdminMemberSummary>(
    `/members/${memberId}/withdraw`,
    sendJson('POST', { reason }),
  );
}

export function fetchAdminProjects(filters: ProjectFilters, signal?: AbortSignal) {
  return adminRequest<AdminPage<AdminProjectSummary>>(
    `/projects?${toQuery({ ...filters, size: ADMIN_PAGE_SIZE })}`,
    { signal },
  );
}

export function fetchAdminProject(projectId: number, signal?: AbortSignal) {
  return adminRequest<AdminProjectDetail>(`/projects/${projectId}`, { signal });
}

export function changeAdminProjectVisibility(
  projectId: number,
  visibility: ProjectVisibility,
  reason: string,
) {
  return adminRequest<AdminProjectSummary>(
    `/projects/${projectId}/visibility`,
    sendJson('PATCH', { visibility, reason }),
  );
}

export function closeAdminProjectRecruitment(projectId: number, reason: string) {
  return adminRequest<AdminProjectSummary>(
    `/projects/${projectId}/close`,
    sendJson('POST', { reason }),
  );
}

export function expelAdminProjectMember(projectId: number, memberId: number, reason: string) {
  return adminRequest<AdminProjectSummary>(
    `/projects/${projectId}/members/${memberId}/expel`,
    sendJson('POST', { reason }),
  );
}

type AuditLogQuery = Partial<AuditLogFilters> & {
  targetType?: AuditTargetType | '';
  targetId?: number;
  size?: number;
};

export function fetchAuditLogs(query: AuditLogQuery, signal?: AbortSignal) {
  return adminRequest<AdminPage<AuditLog>>(
    `/audit-logs?${toQuery({ size: ADMIN_PAGE_SIZE, ...query })}`,
    { signal },
  );
}
