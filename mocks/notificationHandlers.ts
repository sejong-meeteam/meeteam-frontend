import { http, HttpResponse } from 'msw';
import { getSessionMember } from './storage';
import { pageResponse } from './responseMappers';
import type { NotificationType } from '@/components/features/notification/types';

type MockNotification = {
  id: number;
  receiverId: number;
  type: NotificationType;
  createdAt: string;
  isRead: boolean;
  payload: { projectId: number; projectName: string; applicantId?: number; applicantName?: string };
};
const STORAGE_KEY = 'meeteam-notifications';

export function getMockNotifications(): MockNotification[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
}

export function addMockNotification(
  receiverId: number,
  type: NotificationType,
  projectId: number,
  projectName: string,
  applicantId?: number,
  applicantName?: string,
) {
  const notifications = getMockNotifications();
  const notification: MockNotification = {
    id: Math.max(0, ...notifications.map((item) => item.id)) + 1,
    receiverId,
    type,
    createdAt: new Date().toISOString(),
    isRead: false,
    payload: { projectId, projectName, applicantId, applicantName },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([notification, ...notifications]));
  return notification;
}

function success<T>(result: T) {
  return HttpResponse.json({ code: 'COMMON200', result });
}
function unauthenticated() {
  return HttpResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
}

export const notificationHandlers = [
  http.get('/api/v1/notifications/unread/count', () => {
    const member = getSessionMember();
    if (!member) return unauthenticated();
    return success({
      unReadCount: getMockNotifications().filter(
        (item) => item.receiverId === member.memberId && !item.isRead,
      ).length,
    });
  }),
  http.get('/api/v1/notifications', ({ request }) => {
    const member = getSessionMember();
    if (!member) return unauthenticated();
    const notifications = getMockNotifications();
    const result = pageResponse(
      notifications.filter((item) => item.receiverId === member.memberId),
      new URL(request.url).searchParams,
    );
    // Mirrors NotificationService.getNotifications: listing marks ALL pages read.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        notifications.map((item) =>
          item.receiverId === member.memberId ? { ...item, isRead: true } : item,
        ),
      ),
    );
    return success(result);
  }),
  http.get('/api/v1/subscribe', ({ request }) => {
    const member = getSessionMember();
    if (!member) return unauthenticated();
    let timer: ReturnType<typeof setInterval>;
    let stopped = false;
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const sent = new Set<number>();
        const lastId = Number(
          request.headers.get('last-event-id') ??
            Math.max(0, ...getMockNotifications().map((item) => item.id)),
        );
        const send = () => {
          for (const notification of getMockNotifications().toReversed()) {
            if (
              notification.receiverId !== member.memberId ||
              sent.has(notification.id) ||
              notification.id <= lastId
            )
              continue;
            controller.enqueue(
              encoder.encode(
                `id: ${notification.id}\nevent: ${notification.type}\ndata: ${JSON.stringify({ type: notification.type, data: notification.payload, createdAt: notification.createdAt })}\n\n`,
              ),
            );
            sent.add(notification.id);
          }
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        };
        send();
        timer = setInterval(send, 1000);
        request.signal.addEventListener(
          'abort',
          () => {
            if (stopped) return;
            stopped = true;
            clearInterval(timer);
            controller.close();
          },
          { once: true },
        );
      },
      cancel() {
        stopped = true;
        clearInterval(timer);
      },
    });
    return new HttpResponse(stream, { headers: { 'Content-Type': 'text/event-stream' } });
  }),
];
