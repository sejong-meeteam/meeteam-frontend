import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupServer } from 'msw/node';
import {
  applyToProject,
  decideProjectApplication,
  fetchProjectApplications,
} from '@/components/features/project/projectApi';
import { handlers } from '@/mocks/handlers';
import { setSession } from '@/mocks/storage';

const server = setupServer(...handlers);
const nativeFetch = globalThis.fetch;
const stored = new Map<string, string>();
const LEADER_ID = 1;
const PROJECT_ID = 101;
const motivation = '프론트엔드 경험을 살려 프로젝트에 기여하고 싶습니다.';

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
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
  globalThis.fetch = nativeFetch;
});

async function applyAs(memberId: number) {
  setSession(memberId);
  return applyToProject(PROJECT_ID, { jobPositionCode: 'WEB_FRONTEND', motivation });
}

describe('processed applicant history (C4)', () => {
  it('keeps accepted and rejected applicants under their own status with the decision date', async () => {
    const accepted = await applyAs(201);
    const rejected = await applyAs(202);
    const stillPending = await applyAs(204);
    setSession(LEADER_ID);

    await decideProjectApplication(PROJECT_ID, accepted.applicationId, 'ACCEPTED');
    await decideProjectApplication(PROJECT_ID, rejected.applicationId, 'REJECTED');

    const today = new Date().toISOString().slice(0, 10).replaceAll('-', '.');
    const pending = await fetchProjectApplications(PROJECT_ID);
    const acceptedList = await fetchProjectApplications(PROJECT_ID, 'ACCEPTED');
    const rejectedList = await fetchProjectApplications(PROJECT_ID, 'REJECTED');

    expect(pending.map((item) => [item.id, item.status, item.decidedAt])).toEqual([
      [stillPending.applicationId, 'pending', null],
    ]);
    expect(acceptedList.map((item) => [item.id, item.status, item.decidedAt])).toEqual([
      [accepted.applicationId, 'approved', today],
    ]);
    expect(rejectedList.map((item) => [item.id, item.status, item.decidedAt])).toEqual([
      [rejected.applicationId, 'rejected', today],
    ]);
  });
});
