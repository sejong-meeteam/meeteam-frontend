'use client';

import type { AdminMemberDetail } from '@/types/admin';

import Link from 'next/link';
import { Ban, ShieldCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import BaseButton from '@/components/shared/BaseButton';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores/useToastStore';
import {
  ApplicationStatusBadge,
  MemberRoleBadge,
  MemberStatusBadge,
  RecruitmentBadge,
  VisibilityBadge,
} from '../AdminBadges';
import {
  AdminEmptyText,
  AdminErrorState,
  AdminExternalLink,
  AdminInfoList,
  AdminPageHeader,
  AdminPanel,
} from '../AdminLayoutParts';
import AdminTabs from '../AdminTabs';
import { fetchAdminMember } from '../adminApi';
import { TargetAuditLogs } from '../audit/AuditLogTable';
import { PROJECT_CATEGORY_LABEL } from '../constants';
import { formatAdminDate, formatAdminDateTime, formatSuspendedUntil } from '../format';
import { useAdminResource } from '../useAdminResource';
import MemberActionDialog, { type MemberAction } from './MemberActionDialog';

type DetailTab = 'projects' | 'applications' | 'history';

export default function AdminUserDetailPage({ memberId }: { memberId: number }) {
  const currentAdminId = useAuthStore((state) => state.memberId);
  const showToast = useToastStore((state) => state.showToast);
  const [refreshKey, setRefreshKey] = useState(0);
  const [action, setAction] = useState<MemberAction | null>(null);
  const [tab, setTab] = useState<DetailTab>('projects');
  const {
    data: member,
    isLoading,
    errorMessage,
    reload,
  } = useAdminResource((signal) => fetchAdminMember(memberId, signal), `${memberId}:${refreshKey}`);

  if (!member) {
    return (
      <>
        <AdminPageHeader title="회원 상세" backHref="/admin/users" backLabel="사용자 목록" />
        {isLoading ? (
          <DetailSkeleton />
        ) : (
          <AdminErrorState message={errorMessage ?? '회원을 찾을 수 없습니다.'} onRetry={reload} />
        )}
      </>
    );
  }

  const isSelf = member.memberId === currentAdminId;
  const isWithdrawn = member.status === 'WITHDRAWN';
  const canAct = !isSelf && !isWithdrawn;

  return (
    <>
      <AdminPageHeader
        title="회원 상세"
        backHref="/admin/users"
        backLabel="사용자 목록"
        actions={
          canAct ? (
            <>
              <BaseButton size="S" variant="gray" onClick={() => setAction('role')}>
                <ShieldCheck className="mr-1.5 h-4 w-4" aria-hidden strokeWidth={1.8} />
                권한 변경
              </BaseButton>
              {member.status === 'SUSPENDED' ? (
                <BaseButton size="S" variant="gray" onClick={() => setAction('unsuspend')}>
                  정지 해제
                </BaseButton>
              ) : (
                <BaseButton size="S" variant="gray" onClick={() => setAction('suspend')}>
                  <Ban className="mr-1.5 h-4 w-4" aria-hidden strokeWidth={1.8} />
                  이용 정지
                </BaseButton>
              )}
              <BaseButton size="S" variant="danger" onClick={() => setAction('withdraw')}>
                <UserX className="mr-1.5 h-4 w-4" aria-hidden strokeWidth={1.8} />
                강제 탈퇴
              </BaseButton>
            </>
          ) : isSelf ? (
            <p className="text-sm text-mt-text-secondary">본인 계정에는 조치할 수 없습니다.</p>
          ) : null
        }
      />

      <div className="flex flex-col gap-5">
        <MemberSummaryCard member={member} isSelf={isSelf} />

        {member.status === 'SUSPENDED' ? (
          <div
            className="flex items-start gap-3 rounded-2xl border border-mt-danger/30 bg-mt-danger-soft px-5 py-4"
            role="status"
          >
            <Ban className="mt-0.5 h-5 w-5 shrink-0 text-mt-danger" aria-hidden strokeWidth={1.8} />
            <div className="text-sm leading-6">
              <p className="font-bold text-mt-danger">
                이용 정지 중 · {formatSuspendedUntil(member.suspendedUntil)}
              </p>
              <p className="text-mt-text-secondary">사유: {member.suspendReason ?? '-'}</p>
            </div>
          </div>
        ) : null}

        {isWithdrawn ? (
          <div
            className="rounded-2xl border border-mt-border bg-mt-white px-5 py-4 text-sm text-mt-text-secondary"
            role="status"
          >
            탈퇴 처리된 회원입니다. 조치 이력에서 처리 사유를 확인할 수 있습니다.
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-3">
          <AdminPanel title="프로필 정보" className="lg:col-span-1 lg:self-start">
            <ProfileInfo member={member} />
          </AdminPanel>

          <AdminPanel className="lg:col-span-2" bodyClassName="p-5">
            <AdminTabs
              label="회원 활동"
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'projects', label: '참여 프로젝트', count: member.projects.length },
                { value: 'applications', label: '지원 내역', count: member.applications.length },
                { value: 'history', label: '조치 이력' },
              ]}
            />
            <div className="mt-4">
              {tab === 'projects' ? <MemberProjects member={member} /> : null}
              {tab === 'applications' ? <MemberApplications member={member} /> : null}
              {tab === 'history' ? (
                <TargetAuditLogs
                  targetType="MEMBER"
                  targetId={member.memberId}
                  refreshKey={refreshKey}
                />
              ) : null}
            </div>
          </AdminPanel>
        </div>
      </div>

      {action ? (
        <MemberActionDialog
          action={action}
          member={member}
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

function MemberSummaryCard({ member, isSelf }: { member: AdminMemberDetail; isSelf: boolean }) {
  return (
    <AdminPanel>
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <ProfileAvatar
            name={member.name}
            imageUrl={member.profileImageUrl}
            sizeClassName="h-16 w-16"
            textClassName="text-2xl"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl leading-7 font-extrabold text-mt-text-primary">
                {member.name}
              </h2>
              <MemberStatusBadge status={member.status} />
              {member.role === 'ADMIN' ? <MemberRoleBadge role={member.role} /> : null}
              {isSelf ? (
                <span className="text-xs font-semibold text-mt-text-secondary">(나)</span>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-sm text-mt-text-secondary">{member.email}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4 md:w-auto">
          {[
            { label: '회원 번호', value: `#${member.memberId}` },
            { label: '학번', value: member.studentId ?? '-' },
            { label: '가입일', value: formatAdminDate(member.createdAt) },
            { label: '최근 접속', value: formatAdminDateTime(member.lastLoginAt) },
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

function ProfileInfo({ member }: { member: AdminMemberDetail }) {
  return (
    <div className="flex flex-col gap-5">
      <AdminInfoList
        items={[
          { label: '생년월일', value: member.birthDate ? formatAdminDate(member.birthDate) : '-' },
          {
            label: '성별',
            value: member.gender === 'MALE' ? '남성' : member.gender === 'FEMALE' ? '여성' : '-',
          },
          { label: '직군', value: member.jobPositions.join(', ') },
          { label: '권한', value: <MemberRoleBadge role={member.role} /> },
          { label: 'GitHub', value: <AdminExternalLink url={member.githubUrl} /> },
          { label: '블로그', value: <AdminExternalLink url={member.blogUrl} /> },
        ]}
      />
      <div>
        <p className="text-xs font-semibold text-mt-text-secondary">기술 스택</p>
        {member.skills.length ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {member.skills.map((skill) => (
              <li
                key={skill}
                className="rounded-full border border-mt-border bg-mt-badge-bg px-2.5 py-0.5 text-xs font-semibold text-mt-primary"
              >
                {skill}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm">-</p>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold text-mt-text-secondary">자기소개</p>
        <p className="mt-1 text-sm leading-6 whitespace-pre-line text-mt-text-primary">
          {member.introduce ?? '-'}
        </p>
      </div>
    </div>
  );
}

function MemberProjects({ member }: { member: AdminMemberDetail }) {
  if (!member.projects.length)
    return <AdminEmptyText>참여 중인 프로젝트가 없습니다.</AdminEmptyText>;
  return (
    <ul className="divide-y divide-mt-border/70">
      {member.projects.map((project) => (
        <li key={project.projectId}>
          <Link
            href={`/admin/projects/${project.projectId}`}
            className="-mx-2 flex flex-col gap-2 rounded-xl px-2 py-3 transition-colors hover:bg-mt-bg-soft sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-mt-text-primary">
                {project.projectName}
              </p>
              <p className="mt-0.5 text-xs text-mt-text-secondary">
                {PROJECT_CATEGORY_LABEL[project.category]} · {project.isLeader ? '리더' : '팀원'} ·{' '}
                {formatAdminDate(project.createdAt)} 생성
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <RecruitmentBadge status={project.recruitmentStatus} />
              <VisibilityBadge visibility={project.visibility} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function MemberApplications({ member }: { member: AdminMemberDetail }) {
  if (!member.applications.length) return <AdminEmptyText>지원 내역이 없습니다.</AdminEmptyText>;
  return (
    <ul className="divide-y divide-mt-border/70">
      {member.applications.map((application) => (
        <li
          key={application.applicationId}
          className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <Link
              href={`/admin/projects/${application.projectId}`}
              className="truncate text-sm font-bold text-mt-text-primary hover:text-action-primary hover:underline"
            >
              {application.projectName}
            </Link>
            <p className="mt-0.5 text-xs text-mt-text-secondary">
              {application.jobPositionName} · {formatAdminDateTime(application.appliedAt)} 지원
            </p>
          </div>
          <ApplicationStatusBadge status={application.status} />
        </li>
      ))}
    </ul>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy>
      <SkeletonBlock className="h-28 w-full rounded-2xl" />
      <div className="grid gap-5 lg:grid-cols-3">
        <SkeletonBlock className="h-80 w-full rounded-2xl" />
        <SkeletonBlock className="h-80 w-full rounded-2xl lg:col-span-2" />
      </div>
    </div>
  );
}
