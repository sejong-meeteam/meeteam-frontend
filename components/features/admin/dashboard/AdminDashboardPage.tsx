'use client';

import type { LucideIcon } from 'lucide-react';
import type { AdminDashboard } from '@/types/admin';

import Link from 'next/link';
import {
  Ban,
  ChevronRight,
  ClipboardList,
  EyeOff,
  FolderKanban,
  Megaphone,
  UserPlus,
  Users,
} from 'lucide-react';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import { MemberStatusBadge, RecruitmentBadge, VisibilityBadge } from '../AdminBadges';
import { AdminEmptyText, AdminErrorState, AdminPageHeader, AdminPanel } from '../AdminLayoutParts';
import { fetchAdminDashboard } from '../adminApi';
import { AuditLogTable } from '../audit/AuditLogTable';
import { formatAdminDate } from '../format';
import { useAdminResource } from '../useAdminResource';
import ProjectThumbnail from '../projects/ProjectThumbnail';

type KpiItem = {
  label: string;
  value: number;
  href: string;
  icon: LucideIcon;
  tone: 'primary' | 'mint' | 'danger' | 'warning';
};

const KPI_TONE_CLASS: Record<KpiItem['tone'], string> = {
  primary: 'bg-mt-badge-bg text-action-primary',
  mint: 'bg-mt-category-other-bg text-mt-category-other-text',
  danger: 'bg-mt-danger-soft text-mt-danger',
  warning: 'bg-mt-category-creative-bg text-mt-category-creative-text',
};

function memberKpis(stats: AdminDashboard['stats']): KpiItem[] {
  return [
    {
      label: '전체 회원',
      value: stats.totalMembers,
      href: '/admin/users',
      icon: Users,
      tone: 'primary',
    },
    {
      label: '오늘 신규 가입',
      value: stats.newMembersToday,
      href: '/admin/users',
      icon: UserPlus,
      tone: 'mint',
    },
    {
      label: '정지 회원',
      value: stats.suspendedMembers,
      href: '/admin/users?status=SUSPENDED',
      icon: Ban,
      tone: 'danger',
    },
  ];
}

function projectKpis(stats: AdminDashboard['stats']): KpiItem[] {
  return [
    {
      label: '전체 프로젝트',
      value: stats.totalProjects,
      href: '/admin/projects',
      icon: FolderKanban,
      tone: 'primary',
    },
    {
      label: '모집 중',
      value: stats.recruitingProjects,
      href: '/admin/projects?recruitmentStatus=RECRUITING&visibility=VISIBLE',
      icon: Megaphone,
      tone: 'mint',
    },
    {
      label: '숨김 프로젝트',
      value: stats.hiddenProjects,
      href: '/admin/projects?visibility=HIDDEN',
      icon: EyeOff,
      tone: 'warning',
    },
    {
      label: '대기 중 지원서',
      value: stats.pendingApplications,
      href: '/admin/projects?sort=pendingApplicationCount%2Cdesc',
      icon: ClipboardList,
      tone: 'primary',
    },
  ];
}

export default function AdminDashboardPage() {
  const { data, isLoading, errorMessage, reload } = useAdminResource(
    (signal) => fetchAdminDashboard(signal),
    'dashboard',
  );

  return (
    <>
      <AdminPageHeader title="대시보드" description="미팀 서비스의 회원과 프로젝트 현황입니다." />

      {!data && isLoading ? <DashboardSkeleton /> : null}
      {!data && !isLoading ? (
        <AdminErrorState message={errorMessage ?? '현황을 불러오지 못했습니다.'} onRetry={reload} />
      ) : null}

      {data ? (
        <div className="flex flex-col gap-5">
          <div className="grid gap-5 xl:grid-cols-7">
            <KpiGroup title="회원" items={memberKpis(data.stats)} className="xl:col-span-3" />
            <KpiGroup title="프로젝트" items={projectKpis(data.stats)} className="xl:col-span-4" />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <AdminPanel
              title="최근 가입 회원"
              actions={<MoreLink href="/admin/users" />}
              bodyClassName="p-2"
            >
              {data.recentMembers.length ? (
                <ul>
                  {data.recentMembers.map((member) => (
                    <li key={member.memberId}>
                      <Link
                        href={`/admin/users/${member.memberId}`}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-mt-bg-soft"
                      >
                        <ProfileAvatar
                          name={member.name}
                          imageUrl={member.profileImageUrl}
                          sizeClassName="h-9 w-9"
                          textClassName="text-sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-mt-text-primary">
                            {member.name}
                          </p>
                          <p className="truncate text-xs text-mt-text-secondary">
                            {member.representativePosition ?? '직군 미등록'} ·{' '}
                            {formatAdminDate(member.createdAt)} 가입
                          </p>
                        </div>
                        <MemberStatusBadge status={member.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <AdminEmptyText>최근 가입한 회원이 없습니다.</AdminEmptyText>
              )}
            </AdminPanel>

            <AdminPanel
              title="최근 생성 프로젝트"
              actions={<MoreLink href="/admin/projects" />}
              bodyClassName="p-2"
            >
              {data.recentProjects.length ? (
                <ul>
                  {data.recentProjects.map((project) => (
                    <li key={project.projectId}>
                      <Link
                        href={`/admin/projects/${project.projectId}`}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-mt-bg-soft"
                      >
                        <ProjectThumbnail
                          name={project.name}
                          imageUrl={project.imageUrl}
                          sizeClassName="h-9 w-12"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-mt-text-primary">
                            {project.name}
                          </p>
                          <p className="truncate text-xs text-mt-text-secondary">
                            {project.leaderName} · {formatAdminDate(project.createdAt)} 생성
                          </p>
                        </div>
                        <div className="hidden shrink-0 gap-1.5 sm:flex">
                          <RecruitmentBadge status={project.recruitmentStatus} />
                          {project.visibility !== 'VISIBLE' ? (
                            <VisibilityBadge visibility={project.visibility} />
                          ) : null}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <AdminEmptyText>최근 생성된 프로젝트가 없습니다.</AdminEmptyText>
              )}
            </AdminPanel>
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-mt-text-primary">최근 관리자 조치</h2>
              <MoreLink href="/admin/audit-logs" />
            </div>
            <AuditLogTable
              logs={data.recentAuditLogs}
              isLoading={false}
              errorMessage={null}
              onRetry={reload}
            />
          </section>
        </div>
      ) : null}
    </>
  );
}

function KpiGroup({
  title,
  items,
  className = '',
}: {
  title: string;
  items: KpiItem[];
  className?: string;
}) {
  return (
    <section className={className} aria-label={`${title} 지표`}>
      <h2 className="mb-3 text-sm font-bold text-mt-text-secondary">{title}</h2>
      <div
        className={`grid grid-cols-2 gap-3 ${items.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}
      >
        {items.map(({ label, value, href, icon: Icon, tone }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col gap-3 rounded-2xl border border-mt-border bg-mt-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${KPI_TONE_CLASS[tone]}`}
            >
              <Icon className="h-4 w-4" aria-hidden strokeWidth={2} />
            </span>
            <div>
              <p className="text-xs font-semibold text-mt-text-secondary">{label}</p>
              <p className="mt-0.5 text-2xl leading-8 font-extrabold text-mt-text-primary">
                {value.toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function MoreLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-0.5 text-xs font-semibold text-mt-text-secondary transition-colors hover:text-action-primary"
    >
      전체 보기
      <ChevronRight className="h-3.5 w-3.5" aria-hidden strokeWidth={2} />
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <SkeletonBlock key={index} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <SkeletonBlock className="h-72 w-full rounded-2xl" />
        <SkeletonBlock className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  );
}
