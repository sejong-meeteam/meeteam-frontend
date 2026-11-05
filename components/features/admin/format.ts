function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function formatAdminDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

export function formatAdminDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return `${formatAdminDate(value)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatSuspendedUntil(value: string | null | undefined) {
  return value ? `${formatAdminDateTime(value)}까지` : '영구 정지';
}

export function getAdminErrorMessage(error: unknown, fallback = '요청을 처리하지 못했습니다.') {
  return error instanceof Error && error.message ? error.message : fallback;
}
