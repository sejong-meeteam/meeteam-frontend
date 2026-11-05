'use client';

import type { AuditAction, AuditTargetType } from '@/types/admin';

import { RotateCcw } from 'lucide-react';
import BaseButton from '@/components/shared/BaseButton';
import BaseSelect from '@/components/shared/BaseSelect';
import Pagination from '@/components/shared/Pagination';
import { AdminFilterBar, AdminPageHeader } from '../AdminLayoutParts';
import { fetchAuditLogs } from '../adminApi';
import { AUDIT_ACTION_OPTIONS, AUDIT_TARGET_OPTIONS } from '../constants';
import { auditLogFilterSchema } from '../schema';
import { useAdminListParams } from '../useAdminListParams';
import { useAdminResource } from '../useAdminResource';
import { AuditLogTable } from './AuditLogTable';

export default function AdminAuditLogPage() {
  const { filters, updateFilters, resetFilters, isFiltered } =
    useAdminListParams(auditLogFilterSchema);
  const { data, isLoading, errorMessage, reload } = useAdminResource(
    (signal) => fetchAuditLogs(filters, signal),
    JSON.stringify(filters),
  );

  return (
    <>
      <AdminPageHeader
        title="감사 로그"
        description={
          data
            ? `관리자 조치 ${data.totalElements.toLocaleString()}건이 기록되어 있습니다.`
            : '관리자가 수행한 모든 조치와 사유를 확인합니다.'
        }
      />

      <AdminFilterBar>
        <BaseSelect
          aria-label="조치 유형"
          options={AUDIT_ACTION_OPTIONS}
          value={filters.action}
          onChange={(event) => updateFilters({ action: event.target.value as AuditAction })}
        />
        <BaseSelect
          aria-label="대상 유형"
          options={AUDIT_TARGET_OPTIONS}
          value={filters.targetType}
          onChange={(event) => updateFilters({ targetType: event.target.value as AuditTargetType })}
        />
        {isFiltered ? (
          <BaseButton size="S" variant="gray" className="md:ml-auto" onClick={resetFilters}>
            <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden strokeWidth={1.8} />
            초기화
          </BaseButton>
        ) : null}
      </AdminFilterBar>

      <AuditLogTable
        logs={data?.content ?? []}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onRetry={reload}
      />
      <Pagination
        className="mt-5"
        page={filters.page}
        totalPages={data ? Math.ceil(data.totalElements / data.size) : 0}
        onChange={(page) => updateFilters({ page })}
      />
    </>
  );
}
