import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { AuthRequiredError, PermissionDeniedError } from '@/components/features/auth/authError';
import { fetchNotifications } from '@/components/features/notification/notificationApi';
import {
  fetchProposableProjects,
  sendProjectProposal,
} from '@/components/features/project/proposal/proposalApi';
import { projectProposalRequestSchema } from '@/components/features/project/proposal/schema';
import { handlers } from '@/mocks/handlers';
import { clearSession, setSession } from '@/mocks/storage';

const server = setupServer(...handlers);
const nativeFetch = globalThis.fetch;
const stored = new Map<string, string>();
const LEADER_ID = 1;
const RECEIVER_ID = 203;

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
  setSession(LEADER_ID);
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
  globalThis.fetch = nativeFetch;
});

async function firstProposable() {
  const [project] = await fetchProposableProjects(RECEIVER_ID);
  return { project, position: project.openPositions[0] };
}

describe('프로젝트 제안 - 제안 가능한 프로젝트', () => {
  it('내가 리더인 모집 중 프로젝트와 열린 포지션만 돌려준다', async () => {
    const projects = await fetchProposableProjects(RECEIVER_ID);

    expect(projects.length).toBeGreaterThan(0);
    expect(projects.map((project) => project.projectId)).toContain(101);
    expect(projects.map((project) => project.projectId)).not.toContain(102);
    expect(projects[0]).toMatchObject({
      hasPendingProposal: false,
      openPositions: [expect.objectContaining({ jobPositionName: expect.any(String) })],
    });
  });

  it('리더인 프로젝트가 없으면 빈 목록을 돌려준다', async () => {
    setSession(RECEIVER_ID);

    expect(await fetchProposableProjects(204)).toEqual([]);
  });

  it('로그인하지 않으면 로그인 필요 에러를 던진다', async () => {
    clearSession();

    await expect(fetchProposableProjects(RECEIVER_ID)).rejects.toBeInstanceOf(AuthRequiredError);
  });
});

describe('프로젝트 제안 - 보내기', () => {
  it('제안을 보내면 받는 사람에게 프로젝트와 포지션으로 이어지는 알림이 생긴다', async () => {
    const { project, position } = await firstProposable();

    const proposal = await sendProjectProposal(project.projectId, {
      memberId: RECEIVER_ID,
      jobPositionId: position.jobPositionId,
      message: '프론트엔드 경험이 프로젝트와 잘 맞아요.',
    });
    expect(proposal).toMatchObject({ projectId: project.projectId, status: 'PENDING' });

    setSession(RECEIVER_ID);
    const { notifications } = await fetchNotifications();
    const notification = notifications.find((item) => item.type === 'PROJECT_PROPOSAL_RECEIVED');

    expect(notification).toMatchObject({
      variant: 'proposal',
      actionLabel: '프로젝트 살펴보기',
      unread: true,
    });
    expect(notification?.description).toContain('김민지님이');
    expect(notification?.description).toContain(position.jobPositionName);
    expect(notification?.description).toContain('프론트엔드 경험이 프로젝트와 잘 맞아요.');
    expect(notification?.actionHref).toMatch(new RegExp(`^/projects/${project.projectId}\\?`));
  });

  it('보낸 뒤에는 그 프로젝트가 제안 보냄 상태가 되고 같은 제안은 409로 막힌다', async () => {
    const { project, position } = await firstProposable();
    const request = { memberId: RECEIVER_ID, jobPositionId: position.jobPositionId, message: '' };
    await sendProjectProposal(project.projectId, request);

    const after = await fetchProposableProjects(RECEIVER_ID);
    expect(after.find((item) => item.projectId === project.projectId)?.hasPendingProposal).toBe(
      true,
    );
    await expect(sendProjectProposal(project.projectId, request)).rejects.toThrow(
      new RegExp(`이미 '${project.projectName}' 프로젝트로 .+님에게 보낸 제안이 있어요`),
    );
  });

  it('내가 리더가 아닌 프로젝트로는 제안할 수 없다', async () => {
    await expect(
      sendProjectProposal(102, { memberId: RECEIVER_ID, jobPositionId: 3, message: '' }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it('메시지는 300자를 넘을 수 없다', async () => {
    const { project, position } = await firstProposable();
    const request = {
      memberId: RECEIVER_ID,
      jobPositionId: position.jobPositionId,
      message: 'a'.repeat(301),
    };

    expect(projectProposalRequestSchema.safeParse(request).success).toBe(false);
    await expect(sendProjectProposal(project.projectId, request)).rejects.toThrow('300자');
  });
});
