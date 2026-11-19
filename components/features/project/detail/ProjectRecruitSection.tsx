import { useEffect, useRef, type MouseEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ProjectRecord } from '@/types/project';
import AuthLink from '@/components/features/auth/AuthLink';
import BaseButton from '@/components/shared/BaseButton';
import { formatJobRole } from '@/components/shared/jobRoleFormat';
import SkillChip from '@/components/shared/SkillChip';
import StatusBadge from '@/components/shared/StatusBadge';
import { getJobFieldLabel } from '@/constants/jobField';
import { useToastStore } from '@/stores/useToastStore';

type RecruitPositionStatus = 'open' | 'closed';

type RecruitPosition = {
  id: number;
  role: string;
  specialty: string;
  joined: number;
  total: number;
  status: RecruitPositionStatus;
  techStack: string[];
};

function buildApplyHref(projectId: string, position: RecruitPosition) {
  const params = new URLSearchParams({
    jobField: position.role,
    jobPosition: position.specialty,
  });

  return `/projects/${projectId}/apply?${params.toString()}`;
}

function normalizePositionName(value: string) {
  return value.replace(/\s+/g, '').toLowerCase();
}

// Proposal notifications link here with ?jobField=…&jobPosition=… for the offered position.
function isProposedPosition(
  position: RecruitPosition,
  jobField: string | null,
  jobPosition: string | null,
) {
  return (
    Boolean(jobField && jobPosition) &&
    getJobFieldLabel(position.role) === getJobFieldLabel(jobField ?? '') &&
    normalizePositionName(position.specialty) === normalizePositionName(jobPosition ?? '')
  );
}

type ProjectRecruitSectionProps = {
  project: ProjectRecord;
  canApply?: boolean;
};

export default function ProjectRecruitSection({
  project,
  canApply = true,
}: ProjectRecruitSectionProps) {
  const showToast = useToastStore((state) => state.showToast);
  const searchParams = useSearchParams();
  const proposedJobField = searchParams.get('jobField');
  const proposedJobPosition = searchParams.get('jobPosition');
  const proposedPositionRef = useRef<HTMLElement>(null);
  const recruitPositions: RecruitPosition[] =
    project.recruitmentDetails?.map((recruitment, index) => ({
      id: index + 1,
      role: recruitment.jobFieldName,
      specialty: recruitment.jobPositionName,
      joined: recruitment.currentCount,
      total: recruitment.recruitmentCount,
      status: recruitment.isClosed || project.status === 'closed' ? 'closed' : 'open',
      techStack: recruitment.techStacks,
    })) ??
    project.recruitInterests.map((interest, index) => {
      const joined = project.members.filter(
        (member) => !member.isLeader && member.role.includes(interest.major),
      ).length;

      return {
        id: index + 1,
        role: interest.major,
        specialty: interest.minor,
        joined,
        total: interest.count,
        status: joined >= interest.count || project.status === 'closed' ? 'closed' : 'open',
        techStack: project.recruitTechStacks[`${interest.major} - ${interest.minor}`] ?? [],
      };
    });

  const proposedPositionId = recruitPositions.find((position) =>
    isProposedPosition(position, proposedJobField, proposedJobPosition),
  )?.id;

  useEffect(() => {
    if (proposedPositionId !== undefined) {
      proposedPositionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [proposedPositionId]);

  return (
    <section
      className="flex w-full flex-col gap-5 rounded-3xl border border-mt-border bg-mt-white p-6 shadow-sm"
      data-node-id="97:800"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl leading-7 font-extrabold text-mt-text-primary">팀원 모집</h2>
        <p className="text-sm leading-5 font-bold text-mt-primary">
          {recruitPositions.filter((position) => position.status === 'open').length}개 포지션 모집중
        </p>
      </div>

      {recruitPositions.map((position) => {
        const isOpen = position.status === 'open';
        const isProposed = position.id === proposedPositionId;
        const handleApplyClick = (event: MouseEvent<HTMLAnchorElement>) => {
          if (canApply) {
            return;
          }

          event.preventDefault();
          showToast({ message: '이미 참여중인 프로젝트에는 지원할 수 없습니다.' });
        };

        return (
          <article
            key={position.id}
            ref={isProposed ? proposedPositionRef : undefined}
            className={`w-full ${
              isProposed
                ? 'scroll-mt-24 rounded-2xl bg-mt-badge-bg p-5 ring-2 ring-mt-primary'
                : 'border-t border-mt-border pt-5 first:border-t-0 first:pt-0'
            } ${isOpen ? '' : 'opacity-70'}`}
          >
            {isProposed ? (
              <p className="mb-3 text-sm leading-5 font-bold text-mt-primary">
                제안받은 포지션이에요
              </p>
            ) : null}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <h3 className="break-keep text-lg leading-7 font-extrabold text-mt-text-primary">
                      {formatJobRole(position.role, position.specialty)}
                    </h3>
                    <StatusBadge status={position.status} />
                  </div>
                  <span className="text-sm leading-5 font-bold text-mt-text-secondary">
                    {position.joined} / {position.total}명 합류
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {position.techStack.length > 0 ? (
                    position.techStack.map((tech) => <SkillChip key={tech} label={tech} />)
                  ) : (
                    <span className="text-sm leading-5 text-mt-text-secondary">
                      등록된 기술 스택이 없습니다.
                    </span>
                  )}
                </div>
              </div>

              <div className="lg:w-32">
                {isOpen ? (
                  <AuthLink
                    href={buildApplyHref(project.id, position)}
                    onClick={handleApplyClick}
                    aria-disabled={!canApply}
                  >
                    <BaseButton
                      size="S"
                      className={`h-11 w-full rounded-xl px-4 text-sm leading-5 font-bold text-mt-white shadow-none ${
                        canApply
                          ? 'bg-mt-text-primary hover:bg-mt-text-primary'
                          : 'cursor-not-allowed bg-mt-text-secondary'
                      }`}
                    >
                      지원하기
                    </BaseButton>
                  </AuthLink>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
