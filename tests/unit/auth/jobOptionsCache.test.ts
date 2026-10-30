import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalFetch = global.fetch;
const fields = [{ code: 'FRONTEND', name: '프론트', positions: [], techStacks: [] }];

function response(value = fields) {
  return new Response(JSON.stringify({ result: { fields: value } }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => vi.resetModules());
afterEach(() => {
  global.fetch = originalFetch;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('공용 직군 옵션 캐시', () => {
  it('동시 호출과 화면 재진입에서 하나의 요청 결과를 재사용한다', async () => {
    const { fetchJobOptions } = await import('@/components/features/auth/signupApi');
    global.fetch = vi.fn().mockResolvedValue(response());

    const results = await Promise.all([fetchJobOptions(), fetchJobOptions(), fetchJobOptions()]);
    expect(results).toEqual([fields, fields, fields]);
    await expect(fetchJobOptions()).resolves.toEqual(fields);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('5분이 지나면 최신 옵션을 다시 조회한다', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-30T00:00:00Z'));
    const { fetchJobOptions } = await import('@/components/features/auth/signupApi');
    const updated = [{ code: 'BACKEND', name: '백엔드', positions: [], techStacks: [] }];
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(response())
      .mockResolvedValueOnce(response(updated));

    await expect(fetchJobOptions()).resolves.toEqual(fields);
    vi.advanceTimersByTime(5 * 60 * 1000 - 1);
    await expect(fetchJobOptions()).resolves.toEqual(fields);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    await expect(fetchJobOptions()).resolves.toEqual(updated);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('실패한 요청은 공유하되 캐시하지 않아 다음 호출에서 재시도한다', async () => {
    const { fetchJobOptions } = await import('@/components/features/auth/signupApi');
    global.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(response());

    const failed = await Promise.allSettled([fetchJobOptions(), fetchJobOptions()]);
    expect(failed.every((result) => result.status === 'rejected')).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    await expect(fetchJobOptions()).resolves.toEqual(fields);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
