'use client';

import type { AdminMemberSummary, MemberRole, MemberStatus } from '@/types/admin';
import type { MemberFilters } from '../schema';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchJobOptions } from '@/components/features/auth/signupApi';
import BaseButton from '@/components/shared/BaseButton';
import BaseSelect, { type BaseSelectOption } from '@/components/shared/BaseSelect';
import DataTable, { type DataTableColumn } from '@/components/shared/DataTable';
import Pagination from '@/components/shared/Pagination';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import { MemberRoleBadge, MemberStatusBadge } from '../AdminBadges';
import AdminKeywordSearch from '../AdminKeywordSearch';
import { AdminFilterBar, AdminPageHeader } from '../AdminLayoutParts';
import { fetchAdminMembers } from '../adminApi';
import { MEMBER_ROLE_OPTIONS, MEMBER_SORT_OPTIONS, MEMBER_STATUS_OPTIONS } from '../constants';
import { formatAdminDate, formatAdminDateTime } from '../format';
import { memberFilterSchema } from '../schema';
import { useAdminListParams } from '../useAdminListParams';
import { useAdminResource } from '../useAdminResource';

const COLUMNS: DataTableColumn<AdminMemberSummary>[] = [
  {
    key: 'member',
    header: '사용자',
    cell: (member) => (
      <div className="flex min-w-48 items-center gap-3">
        <ProfileAvatar
          name={member.name}
          imageUrl={member.profileImageUrl}
          sizeClassName="h-9 w-9"
          textClassName="text-sm"
        />
        <div className="min-w-0">
          <Link
            href={`/admin/users/${member.memberId}`}
            className="font-bold text-mt-text-primary hover:text-action-primary hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {member.name}
          </Link>
          <p className="truncate text-xs text-mt-text-secondary">{member.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'studentId',
    header: '학번',
    className: 'whitespace-nowrap font-mono text-xs text-mt-text-secondary',
    cell: (member) => member.studentId ?? '-',
  },
  {
    key: 'position',
    header: '대표 직군',
    className: 'whitespace-nowrap',
    cell: (member) => member.representativePosition ?? '-',
  },
  {
    key: 'role',
    header: '권한',
    className: 'whitespace-nowrap',
    cell: (member) => <MemberRoleBadge role={member.role} />,
  },
  {
    key: 'status',
    header: '상태',
    className: 'whitespace-nowrap',
    cell: (member) => (
      <div className="flex flex-col items-start gap-1">
        <MemberStatusBadge status={member.status} />
        {member.status === 'SUSPENDED' ? (
          <span className="text-xs text-mt-text-secondary">
            {member.suspendedUntil ? `~${formatAdminDate(member.suspendedUntil)}` : '영구'}
          </span>
        ) : null}
      </div>
    ),
  },
  {
    key: 'projectCount',
    header: '프로젝트',
    className: 'whitespace-nowrap text-center',
    cell: (member) => member.projectCount,
  },
  {
    key: 'createdAt',
    header: '가입일',
    className: 'whitespace-nowrap text-mt-text-secondary',
    cell: (member) => formatAdminDate(member.createdAt),
  },
  {
    key: 'lastLoginAt',
    header: '최근 접속',
    className: 'whitespace-nowrap text-mt-text-secondary',
    cell: (member) => formatAdminDateTime(member.lastLoginAt),
  },
];

export default function AdminUserListPage() {
  const router = useRouter();
  const { filters, updateFilters, resetFilters, isFiltered } =
    useAdminListParams(memberFilterSchema);
  const jobFieldOptions = useJobFieldOptions();
  const { data, isLoading, errorMessage, reload } = useAdminResource(
    (signal) => fetchAdminMembers(filters, signal),
    JSON.stringify(filters),
  );

  return (
    <>
      <AdminPageHeader
        title="사용자 관리"
        description={
          data
            ? `조건에 맞는 회원 ${data.totalElements.toLocaleString()}명`
            : '회원 정보를 조회하고 정지·권한·탈퇴를 관리합니다.'
        }
      />

      <AdminFilterBar>
        <AdminKeywordSearch
          initialValue={filters.keyword}
          placeholder="이름, 이메일, 학번 검색"
          onSearch={(keyword) => updateFilters({ keyword })}
        />
        <BaseSelect
          aria-label="회원 상태"
          options={MEMBER_STATUS_OPTIONS}
          value={filters.status}
          onChange={(event) => updateFilters({ status: event.target.value as MemberStatus })}
        />
        <BaseSelect
          aria-label="권한"
          options={MEMBER_ROLE_OPTIONS}
          value={filters.role}
          onChange={(event) => updateFilters({ role: event.target.value as MemberRole })}
        />
        <BaseSelect
          aria-label="직군"
          options={jobFieldOptions}
          value={filters.jobFieldCode}
          onChange={(event) => updateFilters({ jobFieldCode: event.target.value })}
        />
        <BaseSelect
          aria-label="정렬"
          options={MEMBER_SORT_OPTIONS}
          value={filters.sort}
          onChange={(event) => updateFilters({ sort: event.target.value as MemberFilters['sort'] })}
        />
        {isFiltered ? (
          <BaseButton size="S" variant="gray" className="md:ml-auto" onClick={resetFilters}>
            <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden strokeWidth={1.8} />
            초기화
          </BaseButton>
        ) : null}
      </AdminFilterBar>

      <DataTable
        caption="회원 목록"
        columns={COLUMNS}
        rows={data?.content ?? []}
        getRowKey={(member) => member.memberId}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onRetry={reload}
        emptyMessage="조건에 맞는 회원이 없습니다."
        onRowClick={(member) => router.push(`/admin/users/${member.memberId}`)}
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

function useJobFieldOptions() {
  const [options, setOptions] = useState<BaseSelectOption[]>([{ value: '', label: '전체 직군' }]);

  useEffect(() => {
    let active = true;
    fetchJobOptions()
      .then((fields) => {
        if (!active) return;
        setOptions([
          { value: '', label: '전체 직군' },
          ...fields.map((field) => ({ value: field.code, label: field.name })),
        ]);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return options;
}
