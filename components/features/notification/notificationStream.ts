import { apiFetch } from '@/components/features/auth/apiClient';
import {
  mapNotificationEvent,
  NOTIFICATION_API_BASE_URL,
  NOTIFICATION_EVENT_TYPES,
} from './notificationApi';
import type { NotificationItem } from './types';

export type StreamEvent = { data: string; lastEventId: string; type: string };

// Handles UTF-8 chunks, multiline data, CR/LF, comments and heartbeat frames.
export function createSseParser(onEvent: (event: StreamEvent) => void) {
  let pending = '';
  let data: string[] = [];
  let type = 'message';
  let lastEventId = '';
  return (chunk: string) => {
    pending += chunk;
    let match: RegExpExecArray | null;
    while ((match = /\r\n|\r|\n/.exec(pending))) {
      if (match[0] === '\r' && match.index === pending.length - 1) break;
      const line = pending.slice(0, match.index);
      pending = pending.slice(match.index + match[0].length);
      if (line === '') {
        if (data.length) onEvent({ data: data.join('\n'), lastEventId, type });
        data = [];
        type = 'message';
        continue;
      }
      if (line.startsWith(':')) continue;
      const separator = line.indexOf(':');
      const field = separator < 0 ? line : line.slice(0, separator);
      const value = separator < 0 ? '' : line.slice(separator + 1).replace(/^ /, '');
      if (field === 'data') data.push(value);
      if (field === 'event') type = value;
      if (field === 'id' && !value.includes('\0')) lastEventId = value;
    }
  };
}

export async function readNotificationStream(
  signal: AbortSignal,
  onNotification: (notification: NotificationItem) => void,
  lastEventId = '',
  onEventId?: (id: string) => void,
) {
  const response = await apiFetch(`${NOTIFICATION_API_BASE_URL}/api/v1/subscribe`, {
    headers: {
      Accept: 'text/event-stream',
      ...(lastEventId ? { 'Last-Event-ID': lastEventId } : {}),
    },
    cache: 'no-store',
    signal,
  });
  if (!response.ok || !response.body) throw new Error('알림 연결에 실패했습니다.');
  if (!response.headers.get('content-type')?.includes('text/event-stream')) {
    throw new Error('알림 스트림 응답 형식이 올바르지 않습니다.');
  }
  const parse = createSseParser((event) => {
    if (signal.aborted) return;
    if (event.lastEventId) onEventId?.(event.lastEventId);
    if (!NOTIFICATION_EVENT_TYPES.some((type) => type === event.type)) return;
    const notification = mapNotificationEvent(event);
    if (notification) onNotification(notification);
  });
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      parse(decoder.decode(value, { stream: true }));
    }
    parse(decoder.decode());
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
