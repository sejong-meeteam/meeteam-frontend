import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '@/components/features/auth/apiClient';
import { markAllNotificationsRead } from '@/components/features/notification/notificationApi';
import {
  createSseParser,
  readNotificationStream,
} from '@/components/features/notification/notificationStream';
import { useNotificationStore } from '@/components/features/notification/store';

const envelope = (result: unknown) => Response.json({ code: 'COMMON200', result });
afterEach(() => {
  vi.unstubAllGlobals();
  useNotificationStore.getState().resetNotifications();
});

describe('notification read contract', () => {
  it('전체 목록 조회의 서버 읽음 처리 후 실제 미확인 개수를 다시 조회한다', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(envelope({ content: [], number: 0, last: true }))
      .mockResolvedValueOnce(envelope({ unReadCount: 0 }));
    vi.stubGlobal('fetch', fetch);
    expect(await markAllNotificationsRead()).toBe(0);
    expect(fetch.mock.calls[0][0]).toContain('/api/v1/notifications?page=0&size=1');
    expect(fetch.mock.calls[1][0]).toBe('/api/v1/notifications/unread/count');
    expect(fetch.mock.calls[0][1].credentials).toBe('include');
  });

  it('서버 실패를 성공으로 처리하지 않고 기존 미확인 개수를 유지한다', async () => {
    useNotificationStore.getState().setUnreadCount(3);
    const fetch = vi
      .fn()
      .mockResolvedValue(Response.json({ message: '읽음 처리 실패' }, { status: 500 }));
    vi.stubGlobal('fetch', fetch);
    await expect(markAllNotificationsRead()).rejects.toThrow('읽음 처리 실패');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(useNotificationStore.getState().unreadCount).toBe(3);
  });
});

describe('authenticated notification stream', () => {
  it('분할된 CRLF·여러 data 줄·heartbeat를 올바르게 파싱한다', () => {
    const events: unknown[] = [];
    const parse = createSseParser((event) => events.push(event));
    parse(': heartbeat\r');
    parse('\nid: 10\r\nevent: PROJECT_APPROVE\r\ndata: first\r\n');
    parse('data: second\r\n\r\n');
    expect(events).toEqual([{ lastEventId: '10', type: 'PROJECT_APPROVE', data: 'first\nsecond' }]);
  });

  it('인증 헤더·쿠키·재연결 ID를 보내고 UTF-8 알림을 수신한다', async () => {
    const payload = JSON.stringify({
      type: 'PROJECT_APPROVE',
      data: { projectId: 102, projectName: '한글 프로젝트' },
    });
    const bytes = new TextEncoder().encode(`id: 11\nevent: PROJECT_APPROVE\ndata: ${payload}\n\n`);
    const stream = new ReadableStream({
      start(controller) {
        for (let offset = 0; offset < bytes.length; offset += 7)
          controller.enqueue(bytes.slice(offset, offset + 7));
        controller.close();
      },
    });
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, { headers: { authorization: 'stream-test-token' } }),
      )
      .mockResolvedValueOnce(
        new Response(stream, { headers: { 'content-type': 'text/event-stream' } }),
      );
    vi.stubGlobal('fetch', fetch);
    await apiFetch('/api/v1/auth/login/sejong', { method: 'POST' });
    const onNotification = vi.fn();
    const onId = vi.fn();
    await readNotificationStream(new AbortController().signal, onNotification, '10', onId);
    const init = fetch.mock.calls[1][1];
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer stream-test-token');
    expect(new Headers(init.headers).get('last-event-id')).toBe('10');
    expect(init.credentials).toBe('include');
    expect(onId).toHaveBeenCalledWith('11');
    expect(onNotification).toHaveBeenCalledWith(
      expect.objectContaining({ id: '11', description: expect.stringContaining('한글 프로젝트') }),
    );
  });

  it('HTML 응답을 스트림 성공으로 처리하지 않는다', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response('<html/>', { headers: { 'content-type': 'text/html' } })),
    );
    await expect(readNotificationStream(new AbortController().signal, vi.fn())).rejects.toThrow(
      '형식',
    );
  });

  it('같은 이벤트 재수신은 개수를 중복 증가시키지 않는다', () => {
    const notification = {
      id: '11',
      type: 'PROJECT_APPROVE' as const,
      createdAt: '',
      title: '승인',
      description: '',
      timestamp: '',
      variant: 'welcome' as const,
    };
    const store = useNotificationStore.getState();
    store.pushRealtimeNotification(notification);
    store.pushRealtimeNotification(notification);
    expect(useNotificationStore.getState().unreadCount).toBe(1);
    store.resetNotifications();
    expect(useNotificationStore.getState().receivedIds).toEqual([]);
  });
});
