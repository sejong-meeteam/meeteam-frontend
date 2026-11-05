'use client';

import type { AdminApplicationStatus, AdminProjectDetail } from '@/types/admin';

import Link from 'next/link';
import { ExternalLink, Eye, EyeOff, Lock, Trash2, UserMinus } from 'lucide-react';
import { useState } from 'react';
import BaseButton from '@/components/shared/BaseButton';
import CategoryBadge from '@/components/shared/CategoryBadge';
import MarkdownContent from '@/components/shared/MarkdownContent';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import StatusBadge from '@/components/shared/StatusBadge';
import { useToastStore } from '@/stores/useToastStore';
import { RecruitmentBadge, VisibilityBadge } from '../AdminBadges';
import {
  AdminErrorState,
  AdminExternalLink,
  AdminInfoList,
  AdminPageHeader,
  AdminPanel,
} from '../AdminLayoutParts';
import { fetchAdminProject } from '../adminApi';
import { TargetAuditLogs } from '../audit/AuditLogTable';
import {
  APPLICATION_STATUS_LABEL,
  PROJECT_CATEGORY_LABEL,
  PROJECT_PLATFORM_LABEL,
} from '../constants';
import { formatAdminDate } from '../format';
import { useAdminResource } from '../useAdminResource';
import ProjectActionDialog, { type ProjectAction } from './ProjectActionDialog';
import ProjectThumbnail from './ProjectThumbnail';

const APPLICATION_STAT_ORDER: AdminApplicationStatus[] = [
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'CANCELLED',
];

export default function AdminProjectDetailPage({ projectId }: { projectId: number }) {
  const showToast = useToastStore((state) => state.showToast);
  const [refreshKey, setRefreshKey] = useState(0);
  const [action, setAction] = useState<ProjectAction | null>(null);
  const {
    data: project,
    isLoading,
    errorMessage,
    reload,
  } = useAdminResource(
    (signal) => fetchAdminProject(projectId, signal),
    `${projectId}:${refreshKey}`,
  );

  if (!project) {
    return (
      <>
        <AdminPageHeader
          title="프로젝트 상세"
          backHref="/admin/projects"
          backLabel="프로젝트 목록"
        />
        {isLoading ? (
          <DetailSkeleton />
        ) : (
          <AdminErrorState
            message={errorMessage ?? '프로젝트를 찾을 수 없습니다.'}
            onRetry={reload}
          />
        )}
      </>
    );
  }

  const isDeleted = project.visibility === 'DELETED';

  return (
    <>
      <AdminPageHeader
        title="프로젝트 상세"
        backHref="/admin/projects"
        backLabel="프로젝트 목록"
        actions={
          <>
            {project.visibility === 'VISIBLE' ? (
              <Link
                href={`/projects/${project.projectId}`}
                target="_blank"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-mt-text-secondary transition-colors hover:bg-mt-white hover:text-mt-text-primary"
              >
                <ExternalLink className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                서비스에서 보기
              </Link>
            ) : null}
            {project.recruitmentStatus !== 'CLOSED' && !isDeleted ? (
              <BaseButton size="S" variant="gray" onClick={() => setAction({ kind: 'close' })}>
                <Lock className="mr-1.5 h-4 w-4" aria-hidden strokeWidth={1.8} />
                모집 강제 마감
              </BaseButton>
            ) : null}
            {project.visibility === 'VISIBLE' ? (
              <BaseButton size="S" variant="gray" onClick={() => setAction({ kind: 'hide' })}>
                <EyeOff className="mr-1.5 h-4 w-4" aria-hidden strokeWidth={1.8} />
                숨기기
              </BaseButton>
            ) : (
              <BaseButton
                size="S"
                variant={isDeleted ? 'primary' : 'gray'}
                onClick={() => setAction({ kind: 'restore' })}
              >
                <Eye className="mr-1.5 h-4 w-4" aria-hidden strokeWidth={1.8} />
                {isDeleted ? '삭제 복구' : '노출 복구'}
              </BaseButton>
            )}
            {!isDeleted ? (
              <BaseButton size="S" variant="danger" onClick={() => setAction({ kind: 'delete' })}>
                <Trash2 className="mr-1.5 h-4 w-4" aria-hidden strokeWidth={1.8} />
                삭제
              </BaseButton>
            ) : null}
          </>
        }
      />

      <div className="flex flex-col gap-5">
        <ProjectSummaryCard project={project} />

        {project.visibility !== 'VISIBLE' ? (
          <div
            className={`rounded-2xl border px-5 py-4 text-sm ${
              isDeleted
                ? 'border-mt-danger/30 bg-mt-danger-soft text-mt-danger'
                : 'border-mt-category-creative-border bg-mt-category-creative-bg text-mt-category-creative-text'
            }`}
            role="status"
          >
            {isDeleted
              ? '삭제된 프로젝트입니다. 서비스에서 조회되지 않으며, 복구하면 다시 노출됩니다.'
              : '숨김 처리된 프로젝트입니다. 프로젝트 찾기와 상세 화면에서 노출되지 않습니다.'}
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-2">
            <AdminPanel title="프로젝트 소개">
              <MarkdownContent value={project.description} className="text-sm leading-6" />
            </AdminPanel>

            <AdminPanel title="모집 현황" bodyClassName="p-0">
              <ul className="divide-y divide-mt-border/70">
                {project.recruitments.map((recruitment) => (
                  <li
                    key={`${recruitment.jobFieldName}-${recruitment.jobPositionName}`}
                    className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-mt-text-primary">
                        {recruitment.jobFieldName} · {recruitment.jobPositionName}
                      </p>
                      <p className="mt-0.5 text-xs text-mt-text-secondary">
                        {recruitment.techStacks.join(', ') || '기술 스택 없음'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm">
                        <strong className="font-bold">{recruitment.currentCount}</strong>
                        <span className="text-mt-text-secondary">
                          {' '}
                          / {recruitment.recruitmentCount}명
                        </span>
                      </span>
                      <StatusBadge status={recruitment.isClosed ? 'closed' : 'open'} size="sm" />
                    </div>
                  </li>
                ))}
              </ul>
            </AdminPanel>

            <AdminPanel title="조치 이력">
              <TargetAuditLogs
                targetType="PROJECT"
                targetId={project.projectId}
                refreshKey={refreshKey}
              />
            </AdminPanel>
          </div>

          <div className="flex flex-col gap-5 lg:self-start">
            <AdminPanel
              title="팀원"
              description={`${project.currentMembers} / ${project.targetMembers}명`}
              bodyClassName="p-2"
            >
              <ul>
                {project.members.map((member) => (
                  <li
                    key={member.memberId}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-mt-bg-soft"
                  >
                    <ProfileAvatar
                      name={member.name}
                      imageUrl={member.profileImageUrl}
                      sizeClassName="h-9 w-9"
                      textClassName="text-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/users/${member.memberId}`}
                          className="truncate text-sm font-bold text-mt-text-primary hover:text-action-primary hover:underline"
                        >
                          {member.name}
                        </Link>
                        {member.isLeader ? <StatusBadge status="leader" /> : null}
                      </div>
                      <p className="truncate text-xs text-mt-text-secondary">
                        {member.jobPositionName ?? '포지션 정보 없음'}
                      </p>
                    </div>
                    {!member.isLeader && !isDeleted ? (
                      <button
                        type="button"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-mt-text-secondary transition-colors hover:bg-mt-danger-soft hover:text-mt-danger"
                        aria-label={`${member.name} 팀에서 제외`}
                        title="팀에서 제외"
                        onClick={() => setAction({ kind: 'expel', member })}
                      >
                        <UserMinus className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </AdminPanel>

            <AdminPanel title="지원 현황">
              <dl className="grid grid-cols-2 gap-3">
                {APPLICATION_STAT_ORDER.map((status) => (
                  <div key={status} className="rounded-xl bg-mt-bg-soft px-4 py-3">
                    <dt className="text-xs font-semibold text-mt-text-secondary">
                      {APPLICATION_STATUS_LABEL[status]}
                    </dt>
                    <dd className="mt-1 text-xl font-extrabold text-mt-text-primary">
                      {project.applicationStats[status]}
                    </dd>
                  </div>
                ))}
              </dl>
            </AdminPanel>

            <AdminPanel title="링크">
              <AdminInfoList
                items={[
                  { label: 'GitHub', value: <AdminExternalLink url={project.githubUrl} /> },
                  {
                    label: '소통 채널',
                    value: <AdminExternalLink url={project.communicationUrl} />,
                  },
                ]}
              />
            </AdminPanel>
          </div>
        </div>
      </div>

      {action ? (
        <ProjectActionDialog
          action={action}
          project={project}
          onClose={() => setAction(null)}
          onDone={(message) => {
            setAction(null);
            setRefreshKey((current) => current + 1);
            showToast({ tone: 'success', message });
          }}
        />
      ) : null}
    </>
  );
}

function ProjectSummaryCard({ project }: { project: AdminProjectDetail }) {
  return (
    <AdminPanel>
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <ProjectThumbnail
            name={project.name}
            imageUrl={project.imageUrl}
            sizeClassName="h-16 w-24"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl leading-7 font-extrabold text-mt-text-primary">
                {project.name}
              </h2>
              <CategoryBadge label={PROJECT_CATEGORY_LABEL[project.category]} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <RecruitmentBadge status={project.recruitmentStatus} />
              <VisibilityBadge visibility={project.visibility} />
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          {[
            {
              label: '리더',
              value: (
                <Link
                  href={`/admin/users/${project.leaderId}`}
                  className="text-action-primary hover:underline"
                >
                  {project.leaderName}
                </Link>
              ),
            },
            { label: '플랫폼', value: PROJECT_PLATFORM_LABEL[project.platform] },
            { label: '생성일', value: formatAdminDate(project.createdAt) },
            {
              label: '모집 마감',
              value: project.deadline ? formatAdminDate(project.deadline) : '인원 충족 시',
            },
          ].map((item) => (
            <div key={item.label}>
              <dt className="text-xs font-semibold text-mt-text-secondary">{item.label}</dt>
              <dd className="mt-0.5 font-medium whitespace-nowrap text-mt-text-primary">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </AdminPanel>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy>
      <SkeletonBlock className="h-28 w-full rounded-2xl" />
      <div className="grid gap-5 lg:grid-cols-3">
        <SkeletonBlock className="h-96 w-full rounded-2xl lg:col-span-2" />
        <SkeletonBlock className="h-96 w-full rounded-2xl" />
      </div>
    </div>
  );
}
