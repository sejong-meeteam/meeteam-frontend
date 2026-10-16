import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { proxyApi } from '@/app/api/upstreamProxy';

afterEach(() => vi.unstubAllGlobals());

it('SSE 인증·재연결 ID를 전달하고 버퍼링 없이 응답한다', async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(': heartbeat\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    }),
  );
  vi.stubGlobal('fetch', fetch);
  const response = await proxyApi(
    new NextRequest('https://frontend.example/api/v1/subscribe', {
      headers: { authorization: 'Bearer test-only', 'last-event-id': '7' },
    }),
    { params: Promise.resolve({ path: ['subscribe'] }) },
  );
  const upstream = fetch.mock.calls[0][1];
  expect(upstream.headers.get('authorization')).toBe('Bearer test-only');
  expect(upstream.headers.get('last-event-id')).toBe('7');
  expect(upstream.signal).toBeInstanceOf(AbortSignal);
  expect(response.headers.get('cache-control')).toBe('no-cache, no-transform');
  expect(response.headers.get('x-accel-buffering')).toBe('no');
  expect(await response.text()).toBe(': heartbeat\n\n');
});

it('다른 Origin의 변경 요청은 백엔드에 보내지 않는다', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const response = await proxyApi(
    new NextRequest('https://frontend.example/api/v1/projects/1', {
      method: 'DELETE',
      headers: { origin: 'https://untrusted.example' },
    }),
    { params: Promise.resolve({ path: ['projects', '1'] }) },
  );
  expect(response.status).toBe(403);
  expect(fetch).not.toHaveBeenCalled();
});

it('네트워크 실패는 API_UNAVAILABLE로 구분한다', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
  const response = await proxyApi(new NextRequest('https://frontend.example/api/v1/projects/1'), {
    params: Promise.resolve({ path: ['projects', '1'] }),
  });
  expect(response.status).toBe(502);
  expect(await response.json()).toMatchObject({ code: 'API_UNAVAILABLE' });
});
