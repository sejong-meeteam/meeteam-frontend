import type { AuditLog } from '@/types/admin';
import {
  DEMO_ADMIN_MEMBER_ID,
  DEMO_SUSPENDED_MEMBER_ID,
  DEMO_WITHDRAWN_MEMBER_ID,
} from './fixtures';

const AUDIT_LOGS_KEY = 'meeteam-admin-audit-logs';

function createSeedAuditLogs(): AuditLog[] {
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  return [
    {
      id: 2,
      adminId: DEMO_ADMIN_MEMBER_ID,
      adminName: '미팀 운영자',
      action: 'MEMBER_SUSPEND',
      targetType: 'MEMBER',
      targetId: DEMO_SUSPENDED_MEMBER_ID,
      targetName: '조유나',
      reason: '프로젝트 Q&A에 반복적인 홍보성 글 작성',
      metadata: { days: 7 },
      createdAt: new Date(now - 2 * day).toISOString(),
    },
    {
      id: 1,
      adminId: DEMO_ADMIN_MEMBER_ID,
      adminName: '미팀 운영자',
      action: 'MEMBER_WITHDRAW',
      targetType: 'MEMBER',
      targetId: DEMO_WITHDRAWN_MEMBER_ID,
      targetName: '오현우',
      reason: '본인 요청에 따른 계정 정리',
      metadata: null,
      createdAt: new Date(now - 6 * day).toISOString(),
    },
  ];
}

export function getAuditLogs(): AuditLog[] {
  try {
    const stored = localStorage.getItem(AUDIT_LOGS_KEY);
    if (!stored) return createSeedAuditLogs();
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as AuditLog[]) : createSeedAuditLogs();
  } catch {
    return createSeedAuditLogs();
  }
}

export function appendAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>) {
  const logs = getAuditLogs();
  const entry: AuditLog = {
    ...log,
    id: Math.max(0, ...logs.map((item) => item.id)) + 1,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify([entry, ...logs]));
  return entry;
}
