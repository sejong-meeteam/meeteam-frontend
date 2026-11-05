'use client';

import type {
  AdminProjectCategory,
  AdminProjectSummary,
  AdminRecruitmentStatus,
  ProjectVisibility,
} from '@/types/admin';
import type { ProjectFilters } from '../schema';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import BaseButton from '@/components/shared/BaseButton';
import BaseSelect from '@/components/shared/BaseSelect';
import CategoryBadge from '@/components/shared/CategoryBadge';
import DataTable, { type DataTableColumn } from '@/components/shared/DataTable';
import Pagination from '@/components/shared/Pagination';
import { RecruitmentBadge, VisibilityBadge } from '../AdminBadges';
import AdminKeywordSearch from '../AdminKeywordSearch';
import { AdminFilterBar, AdminPageHeader } from '../AdminLayoutParts';
import { fetchAdminProjects } from '../adminApi';
import {
  PROJECT_CATEGORY_LABEL,
  PROJECT_CATEGORY_OPTIONS,
  PROJECT_PLATFORM_LABEL,
  PROJECT_SORT_OPTIONS,
  PROJECT_VISIBILITY_OPTIONS,
  RECRUITMENT_STATUS_OPTIONS,
} from '../constants';
import { formatAdminDate } from '../format';
import { projectFilterSchema } from '../schema';
import { useAdminListParams } from '../useAdminListParams';
import { useAdminResource } from '../useAdminResource';
import ProjectThumbnail from './ProjectThumbnail';

const COLUMNS: DataTableColumn<AdminProjectSummary>[] = [
  {
    key: 'project',
    header: '프로젝트',
    cell: (project) => (
      <div className="flex min-w-56 items-center gap-3">
        <ProjectThumbnail name={project.name} imageUrl={project.imageUrl} />
        <div className="min-w-0">
          <Link
            href={`/admin/projects/${project.projectId}`}
            className="font-bold text-mt-text-primary hover:text-action-primary hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {project.name}
          </Link>
          <p className="text-xs text-mt-text-secondary">
            #{project.projectId} · {PROJECT_PLATFORM_LABEL[project.platform]}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: 'leader',
    header: '리더',
    className: 'whitespace-nowrap',
    cell: (project) => (
      <Link
        href={`/admin/users/${project.leaderId}`}
        className="hover:text-action-primary hover:underline"
        onClick={(event) => event.stopPropagation()}
      >
        {project.leaderName}
      </Link>
    ),
  },
  {
    key: 'category',
    header: '카테고리',
    className: 'whitespace-nowrap',
    cell: (project) => <CategoryBadge label={PROJECT_CATEGORY_LABEL[project.category]} />,
  },
  {
    key: 'members',
    header: '인원',
    className: 'whitespace-nowrap',
    cell: (project) => (
      <span>
        <strong className="font-bold">{project.currentMembers}</strong>
        <span className="text-mt-text-secondary"> / {project.targetMembers}</span>
      </span>
    ),
  },
  {
    key: 'recruitment',
    header: '모집',
    className: 'whitespace-nowrap',
    cell: (project) => <RecruitmentBadge status={project.recruitmentStatus} />,
  },
  {
    key: 'visibility',
    header: '노출',
    className: 'whitespace-nowrap',
    cell: (project) => <VisibilityBadge visibility={project.visibility} />,
  },
  {
    key: 'pending',
    header: '대기 지원',
    className: 'whitespace-nowrap text-center',
    cell: (project) =>
      project.pendingApplicationCount ? (
        <span className="font-bold text-action-primary">{project.pendingApplicationCount}</span>
      ) : (
        <span className="text-mt-text-secondary">0</span>
      ),
  },
  {
    key: 'createdAt',
    header: '생성일',
    className: 'whitespace-nowrap text-mt-text-secondary',
    cell: (project) => formatAdminDate(project.createdAt),
  },
];

export default function AdminProjectListPage() {
  const router = useRouter();
  const { filters, updateFilters, resetFilters, isFiltered } =
    useAdminListParams(projectFilterSchema);
  const { data, isLoading, errorMessage, reload } = useAdminResource(
    (signal) => fetchAdminProjects(filters, signal),
    JSON.stringify(filters),
  );

  return (
    <>
      <AdminPageHeader
        title="프로젝트 관리"
        description={
          data
            ? `조건에 맞는 프로젝트 ${data.totalElements.toLocaleString()}개`
            : '프로젝트를 조회하고 노출·모집 상태와 팀원을 관리합니다.'
        }
      />

      <AdminFilterBar>
        <AdminKeywordSearch
          initialValue={filters.keyword}
          placeholder="프로젝트명, 리더 검색"
          onSearch={(keyword) => updateFilters({ keyword })}
        />
        <BaseSelect
          aria-label="카테고리"
          options={PROJECT_CATEGORY_OPTIONS}
          value={filters.category}
          onChange={(event) =>
            updateFilters({ category: event.target.value as AdminProjectCategory })
          }
        />
        <BaseSelect
          aria-label="모집 상태"
          options={RECRUITMENT_STATUS_OPTIONS}
          value={filters.recruitmentStatus}
          onChange={(event) =>
            updateFilters({ recruitmentStatus: event.target.value as AdminRecruitmentStatus })
          }
        />
        <BaseSelect
          aria-label="노출 상태"
          options={PROJECT_VISIBILITY_OPTIONS}
          value={filters.visibility}
          onChange={(event) =>
            updateFilters({ visibility: event.target.value as ProjectVisibility })
          }
        />
        <BaseSelect
          aria-label="정렬"
          options={PROJECT_SORT_OPTIONS}
          value={filters.sort}
          onChange={(event) =>
            updateFilters({ sort: event.target.value as ProjectFilters['sort'] })
          }
        />
        {isFiltered ? (
          <BaseButton size="S" variant="gray" className="md:ml-auto" onClick={resetFilters}>
            <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden strokeWidth={1.8} />
            초기화
          </BaseButton>
        ) : null}
      </AdminFilterBar>

      <DataTable
        caption="프로젝트 목록"
        columns={COLUMNS}
        rows={data?.content ?? []}
        getRowKey={(project) => project.projectId}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onRetry={reload}
        emptyMessage="조건에 맞는 프로젝트가 없습니다."
        onRowClick={(project) => router.push(`/admin/projects/${project.projectId}`)}
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
