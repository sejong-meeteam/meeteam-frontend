import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from '@/mocks/handlers';
import { getProjects, setSession } from '@/mocks/storage';
import { replaceMockProject } from '@/mocks/projectManagementHandlers';
import {
  DEMO_ADMIN_MEMBER_ID,
  DEMO_SUSPENDED_MEMBER_ID,
  DEMO_WITHDRAWN_MEMBER_ID,
} from '@/mocks/fixtures';
import * as adminApi from '@/components/features/admin/adminApi';
import { memberFilterSchema, projectFilterSchema } from '@/components/features/admin/schema';
import { loginMember } from '@/components/features/auth/loginApi';
import { fetchProjectSearchResults } from '@/components/features/project/find/projectFindApi';

const server = setupServer(...handlers);
const nativeFetch = globalThis.fetch;
const stored = new Map<string, string>();
const REASON = '운영 정책 위반으로 조치합니다.';

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
  setSession(DEMO_ADMIN_MEMBER_ID);
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
  globalThis.fetch = nativeFetch;
});

const MEMBER_FILTERS = memberFilterSchema.parse({});
const PROJECT_FILTERS = projectFilterSchema.parse({});

describe('admin filters', () => {
  it('falls back to defaults for invalid URL params', () => {
    expect(memberFilterSchema.parse({ status: 'UNKNOWN', page: '-1', sort: 'bad' })).toEqual({
      keyword: '',
      status: '',
      role: '',
      jobFieldCode: '',
      sort: 'createdAt,desc',
      page: 0,
    });
    expect(projectFilterSchema.parse({ visibility: 'HIDDEN', page: '2' })).toMatchObject({
      visibility: 'HIDDEN',
      page: 2,
    });
  });
});

describe('admin access', () => {
  it('rejects non-admin members', async () => {
    setSession(1);
    await expect(adminApi.fetchAdminDashboard()).rejects.toThrow('관리자 권한이 필요합니다.');
  });

  it('masks student ids in lists and exposes them in detail', async () => {
    const page = await adminApi.fetchAdminMembers({ ...MEMBER_FILTERS, keyword: '김민지' });
    expect(page.content[0].studentId).toBe('2026****');
    const detail = await adminApi.fetchAdminMember(1);
    expect(detail.studentId).toBe('20260001');
  });
});

describe('member actions', () => {
  it('suspends a member, blocks login, records audit log, then unsuspends', async () => {
    await expect(adminApi.suspendAdminMember(2, { days: 7, reason: '짧음' })).rejects.toThrow(
      '사유를 5자 이상',
    );
    const summary = await adminApi.suspendAdminMember(2, { days: 7, reason: REASON });
    expect(summary.status).toBe('SUSPENDED');
    await expect(loginMember({ studentId: '20250012', password: 'demo1234' })).rejects.toThrow(
      '이용이 정지된 계정',
    );

    const logs = await adminApi.fetchAuditLogs({ targetType: 'MEMBER', targetId: 2 });
    expect(logs.content[0]).toMatchObject({ action: 'MEMBER_SUSPEND', reason: REASON });

    setSession(DEMO_ADMIN_MEMBER_ID);
    expect((await adminApi.unsuspendAdminMember(2, REASON)).status).toBe('ACTIVE');
  });

  it('protects self actions and the last admin', async () => {
    await expect(
      adminApi.suspendAdminMember(DEMO_ADMIN_MEMBER_ID, { days: null, reason: REASON }),
    ).rejects.toThrow('본인 계정');
    await adminApi.changeAdminMemberRole(2, 'ADMIN', REASON);
    setSession(2);
    await adminApi.changeAdminMemberRole(DEMO_ADMIN_MEMBER_ID, 'USER', REASON);
    await expect(adminApi.changeAdminMemberRole(2, 'USER', REASON)).rejects.toThrow('본인 계정');
  });

  it('requires led projects to be hidden before withdrawal', async () => {
    await expect(adminApi.withdrawAdminMember(1, REASON)).rejects.toThrow('리더 프로젝트');
    await expect(adminApi.withdrawAdminMember(DEMO_WITHDRAWN_MEMBER_ID, REASON)).rejects.toThrow(
      '이미 탈퇴한 회원',
    );
    const page = await adminApi.fetchAdminMembers({ ...MEMBER_FILTERS, status: 'SUSPENDED' });
    expect(page.content.map((member) => member.memberId)).toContain(DEMO_SUSPENDED_MEMBER_ID);
  });
});

describe('project actions', () => {
  it('hides and restores a project in public search', async () => {
    const [project] = getProjects();
    await adminApi.changeAdminProjectVisibility(project.id, 'HIDDEN', REASON);
    const hidden = await fetchProjectSearchResults(
      {
        searchValue: project.name,
        category: '모든 카테고리',
        recruitOnly: 'all',
        platform: '전체',
        field: '전체',
        sort: 'latest',
      },
      0,
      10,
    );
    expect(hidden.projects.some((item) => item.id === project.id)).toBe(false);

    const list = await adminApi.fetchAdminProjects({ ...PROJECT_FILTERS, visibility: 'HIDDEN' });
    expect(list.content.map((item) => item.projectId)).toEqual([project.id]);

    await adminApi.changeAdminProjectVisibility(project.id, 'VISIBLE', REASON);
    await expect(
      adminApi.changeAdminProjectVisibility(project.id, 'VISIBLE', REASON),
    ).rejects.toThrow('이미 같은 노출 상태');
  });

  it('force closes recruitment and expels team members', async () => {
    const [project] = getProjects();
    replaceMockProject({ ...project, memberIds: [project.leaderId, 2], currentMembers: 2 });

    expect(
      (await adminApi.closeAdminProjectRecruitment(project.id, REASON)).recruitmentStatus,
    ).toBe('CLOSED');
    await expect(
      adminApi.expelAdminProjectMember(project.id, project.leaderId, REASON),
    ).rejects.toThrow('리더는');
    const summary = await adminApi.expelAdminProjectMember(project.id, 2, REASON);
    expect(summary.currentMembers).toBe(1);

    const logs = await adminApi.fetchAuditLogs({ targetType: 'PROJECT', targetId: project.id });
    expect(logs.content.map((log) => log.action)).toEqual([
      'PROJECT_MEMBER_EXPEL',
      'PROJECT_FORCE_CLOSE',
    ]);
  });
});
