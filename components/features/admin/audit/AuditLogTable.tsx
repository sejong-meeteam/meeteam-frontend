'use client';

import type { AuditLog, AuditTargetType } from '@/types/admin';

import Link from 'next/link';
import { useState } from 'react';
import DataTable, { type DataTableColumn } from '@/components/shared/DataTable';
import Pagination from '@/components/shared/Pagination';
import { AuditActionBadge } from '../AdminBadges';
import { fetchAuditLogs } from '../adminApi';
import { AUDIT_TARGET_LABEL, MEMBER_ROLE_LABEL, PROJECT_VISIBILITY_LABEL } from '../constants';
import { formatAdminDateTime } from '../format';
import { useAdminResource } from '../useAdminResource';

const TARGET_PATH: Record<AuditTargetType, string> = {
  MEMBER: '/admin/users',
  PROJECT: '/admin/projects',
};

function labelOf(value: string | number | null | undefined) {
  if (value === null || value === undefined) return '';
  const key = String(value);
  return (
    MEMBER_ROLE_LABEL[key as keyof typeof MEMBER_ROLE_LABEL] ??
    PROJECT_VISIBILITY_LABEL[key as keyof typeof PROJECT_VISIBILITY_LABEL] ??
    key
  );
}

export function describeAuditMetadata(log: AuditLog) {
  const metadata = log.metadata;
  if (!metadata) return null;
  if ('days' in metadata) return metadata.days ? `${metadata.days}일 정지` : '영구 정지';
  if ('from' in metadata) return `${labelOf(metadata.from)} → ${labelOf(metadata.to)}`;
  if ('memberName' in metadata) return `제외된 팀원: ${metadata.memberName ?? metadata.memberId}`;
  return null;
}

type AuditLogTableProps = {
  logs: AuditLog[];
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  showTarget?: boolean;
  framed?: boolean;
};

export function AuditLogTable({
  logs,
  isLoading,
  errorMessage,
  onRetry,
  showTarget = true,
  framed = true,
}: AuditLogTableProps) {
  const columns: DataTableColumn<AuditLog>[] = [
    {
      key: 'createdAt',
      header: '일시',
      className: 'whitespace-nowrap text-mt-text-secondary',
      cell: (log) => formatAdminDateTime(log.createdAt),
    },
    {
      key: 'action',
      header: '조치',
      className: 'whitespace-nowrap',
      cell: (log) => (
        <div className="flex flex-col items-start gap-1">
          <AuditActionBadge action={log.action} />
          {describeAuditMetadata(log) ? (
            <span className="text-xs text-mt-text-secondary">{describeAuditMetadata(log)}</span>
          ) : null}
        </div>
      ),
    },
    ...(showTarget
      ? [
          {
            key: 'target',
            header: '대상',
            className: 'whitespace-nowrap',
            cell: (log: AuditLog) => (
              <Link
                href={`${TARGET_PATH[log.targetType]}/${log.targetId}`}
                className="group inline-flex flex-col"
              >
                <span className="font-semibold text-mt-text-primary group-hover:text-action-primary group-hover:underline">
                  {log.targetName}
                </span>
                <span className="text-xs text-mt-text-secondary">
                  {AUDIT_TARGET_LABEL[log.targetType]} #{log.targetId}
                </span>
              </Link>
            ),
          },
        ]
      : []),
    {
      key: 'reason',
      header: '사유',
      className: 'min-w-60 max-w-md whitespace-normal leading-5',
      cell: (log) => log.reason,
    },
    {
      key: 'admin',
      header: '처리자',
      className: 'whitespace-nowrap text-mt-text-secondary',
      cell: (log) => log.adminName,
    },
  ];

  return (
    <DataTable
      caption="관리자 조치 이력"
      columns={columns}
      rows={logs}
      getRowKey={(log) => log.id}
      isLoading={isLoading}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyMessage="기록된 관리자 조치가 없습니다."
      framed={framed}
    />
  );
}

type TargetAuditLogsProps = {
  targetType: AuditTargetType;
  targetId: number;
  refreshKey: number;
};

export function TargetAuditLogs({ targetType, targetId, refreshKey }: TargetAuditLogsProps) {
  const [page, setPage] = useState(0);
  const { data, isLoading, errorMessage, reload } = useAdminResource(
    (signal) => fetchAuditLogs({ targetType, targetId, page, size: 5 }, signal),
    `${targetType}:${targetId}:${page}:${refreshKey}`,
  );

  return (
    <div className="flex flex-col gap-4">
      <AuditLogTable
        logs={data?.content ?? []}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onRetry={reload}
        showTarget={false}
        framed={false}
      />
      <Pagination
        page={page}
        totalPages={data ? Math.ceil(data.totalElements / data.size) : 0}
        onChange={setPage}
      />
    </div>
  );
}
