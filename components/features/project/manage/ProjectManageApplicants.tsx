'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, CheckCircle2, ExternalLink, Mail, XCircle } from 'lucide-react';
import { useAuthRequiredModal } from '@/components/features/auth/useAuthRequiredModal';
import {
  decideProjectApplication,
  fetchProjectApplicationDetail,
  fetchProjectApplications,
  type ProjectApplicationDecision,
  type ProjectApplicationListStatus,
} from '@/components/features/project/projectApi';
import ConfirmModal from '@/components/shared/ConfirmModal';
import MarkdownContent from '@/components/shared/MarkdownContent';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import Tabs from '@/components/shared/Tabs';
import ToastMessage from '@/components/shared/ToastMessage';
import { getJobFieldLabel } from '@/constants/jobField';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores/useToastStore';
import type { ProjectApplicant, ProjectApplicantStatus } from '@/types/project';
import ProjectApplicantDetailModal from './ProjectApplicantDetailModal';
import ProjectManageShell from './ProjectManageShell';

type ProjectManageApplicantsProps = {
  projectId: string;
};

type ApplicantListView = {
  status: ProjectApplicantStatus;
  tabLabel: string;
  heading: string;
  emptyTitle: string;
  emptyDescription: string;
};

const APPLICANT_LIST_VIEWS: Record<ProjectApplicationListStatus, ApplicantListView> = {
  PENDING: {
    status: 'pending',
    tabLabel: '대기 중',
    heading: '대기 중인 지원자',
    emptyTitle: '대기 중인 지원자가 없습니다.',
    emptyDescription: '새로운 지원이 들어오면 이곳에서 검토할 수 있습니다.',
  },
  ACCEPTED: {
    status: 'approved',
    tabLabel: '승인됨',
    heading: '승인한 지원자',
    emptyTitle: '아직 승인한 지원자가 없습니다.',
    emptyDescription: '승인한 지원자는 팀원이 되고, 이곳에 처리 내역이 남아요.',
  },
  REJECTED: {
    status: 'rejected',
    tabLabel: '거절됨',
    heading: '거절한 지원자',
    emptyTitle: '거절한 지원자가 없습니다.',
    emptyDescription: '거절한 지원자도 이곳에 처리 내역이 남아요.',
  },
};

const APPLICANT_LIST_TABS = (
  Object.keys(APPLICANT_LIST_VIEWS) as ProjectApplicationListStatus[]
).map((value) => ({ value, label: APPLICANT_LIST_VIEWS[value].tabLabel }));

const DECISION_SUCCESS_MESSAGE: Record<ProjectApplicationDecision, (name: string) => string> = {
  ACCEPTED: (name) => `${name}님을 승인했어요.`,
  REJECTED: (name) => `${name}님의 지원을 거절했어요.`,
};

function ProjectManageApplicantsSkeleton() {
  return (
    <section className="overflow-hidden rounded-2xl border border-mt-border/40 bg-mt-white shadow-sm">
      <header className="border-b border-mt-border/40 bg-mt-bg-soft/50 px-6 py-4">
        <SkeletonBlock className="h-6 w-28" />
      </header>
      <div className="space-y-6 px-6 py-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`project-applicant-skeleton-${index}`}
            className={index === 0 ? '' : 'border-t border-mt-border/40 pt-6'}
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="flex min-w-0 gap-4 lg:w-52">
                <SkeletonBlock className="h-14 w-14 rounded-2xl" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-6 w-24" />
                  <SkeletonBlock className="h-4 w-20" />
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <SkeletonBlock className="h-4 w-64" />
                <SkeletonBlock className="h-20 w-full rounded-xl" />
                <SkeletonBlock className="h-10 w-56 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DecisionRecord({
  status,
  decidedAt,
}: {
  status: ProjectApplicationDecision;
  decidedAt?: string | null;
}) {
  const isAccepted = status === 'ACCEPTED';
  const Icon = isAccepted ? CheckCircle2 : XCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm leading-5 font-bold ${
        isAccepted ? 'text-mt-primary' : 'text-mt-hero-blue'
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden strokeWidth={1.8} />
      {decidedAt ?? '처리일 미확인'} {isAccepted ? '승인함' : '거절함'}
    </span>
  );
}

export default function ProjectManageApplicants({ projectId }: ProjectManageApplicantsProps) {
  const memberId = useAuthStore((state) => state.memberId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);

  // Applicant data belongs only to the current authenticated viewer and project.
  if (!isAuthenticated || isLoggingOut || memberId === null) return null;

  return <ProjectApplicantsView key={`${memberId}:${projectId}`} projectId={projectId} />;
}

function ProjectApplicantsView({ projectId }: ProjectManageApplicantsProps) {
  const handleAuthRequired = useAuthRequiredModal();
  const showToast = useToastStore((state) => state.showToast);
  const [listStatus, setListStatus] = useState<ProjectApplicationListStatus>('PENDING');
  const [applicants, setApplicants] = useState<ProjectApplicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<ProjectApplicant | null>(null);
  const [detailApplicant, setDetailApplicant] = useState<ProjectApplicant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [decisionLoadingId, setDecisionLoadingId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ProjectApplicant | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detailErrorMessage, setDetailErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const listView = APPLICANT_LIST_VIEWS[listStatus];

  const detailRequestRef = useRef<AbortController | null>(null);
  const listRequestRef = useRef<AbortController | null>(null);
  const redirectPath = `/projects/${projectId}/manage/applicants`;

  useEffect(() => {
    const request = new AbortController();
    listRequestRef.current = request;

    const load = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const nextApplicants = await fetchProjectApplications(
          projectId,
          listStatus,
          request.signal,
        );
        if (!request.signal.aborted) {
          const { status } = APPLICANT_LIST_VIEWS[listStatus];
          setApplicants(nextApplicants.filter((applicant) => applicant.status === status));
        }
      } catch (error) {
        if (request.signal.aborted) return;
        setApplicants([]);
        if (handleAuthRequired(error, { redirectPath })) return;
        setErrorMessage(
          error instanceof Error ? error.message : '지원자 목록을 불러오지 못했습니다.',
        );
      } finally {
        if (!request.signal.aborted) setIsLoading(false);
      }
    };

    void load();
    return () => request.abort();
  }, [handleAuthRequired, listStatus, projectId, redirectPath, refreshKey]);

  const handleListStatusChange = (nextStatus: ProjectApplicationListStatus) => {
    if (nextStatus === listStatus) {
      return;
    }

    setApplicants([]);
    setIsLoading(true);
    setListStatus(nextStatus);
  };

  const closeDetail = () => {
    detailRequestRef.current?.abort();
    detailRequestRef.current = null;
    setSelectedApplicant(null);
    setDetailApplicant(null);
    setDetailErrorMessage(null);
    setIsDetailLoading(false);
  };

  useEffect(() => () => detailRequestRef.current?.abort(), []);

  const handleOpenDetail = async (applicant: ProjectApplicant) => {
    detailRequestRef.current?.abort();
    const request = new AbortController();
    detailRequestRef.current = request;
    setSelectedApplicant(applicant);
    setDetailApplicant(null);
    setDetailErrorMessage(null);
    setIsDetailLoading(true);

    try {
      const detail = await fetchProjectApplicationDetail(projectId, applicant.id, request.signal);
      if (!request.signal.aborted) {
        setDetailApplicant({ ...applicant, ...detail, appliedAt: applicant.appliedAt });
      }
    } catch (error) {
      if (request.signal.aborted) return;
      if (handleAuthRequired(error, { redirectPath })) {
        closeDetail();
        return;
      }
      setDetailErrorMessage(
        error instanceof Error ? error.message : '지원서 상세 정보를 불러오지 못했습니다.',
      );
    } finally {
      if (!request.signal.aborted) setIsDetailLoading(false);
    }
  };

  const handleDecision = async (
    applicant: ProjectApplicant,
    decision: ProjectApplicationDecision,
  ) => {
    if (decisionLoadingId !== null) {
      return;
    }

    const request = listRequestRef.current;
    try {
      setDecisionLoadingId(applicant.id);
      setErrorMessage(null);

      await decideProjectApplication(projectId, applicant.id, decision);
      showToast({ tone: 'success', message: DECISION_SUCCESS_MESSAGE[decision](applicant.name) });
      if (request?.signal.aborted) return;
      setApplicants((current) => current.filter((item) => item.id !== applicant.id));

      if (selectedApplicant?.id === applicant.id) {
        closeDetail();
      }
      setRefreshKey((current) => current + 1);
    } catch (error) {
      if (request?.signal.aborted || handleAuthRequired(error, { redirectPath })) {
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : '지원자 처리 중 오류가 발생했습니다.',
      );
    } finally {
      setDecisionLoadingId(null);
    }
  };

  const isPendingList = listStatus === 'PENDING';
  const isInitialLoading = isLoading && applicants.length === 0;
  const pendingApplicantsCount = isPendingList && !isInitialLoading ? applicants.length : undefined;

  return (
    <ProjectManageShell
      projectId={projectId}
      activeTab="applicants"
      pendingApplicantsCount={pendingApplicantsCount}
      refreshKey={refreshKey}
    >
      <div className="space-y-6">
        <ToastMessage message={errorMessage} />

        <Tabs
          label="지원자 처리 상태"
          value={listStatus}
          tabs={APPLICANT_LIST_TABS}
          onChange={handleListStatusChange}
        />

        {isInitialLoading ? (
          <ProjectManageApplicantsSkeleton />
        ) : (
          <section className="overflow-hidden rounded-2xl border border-mt-border/40 bg-mt-white shadow-sm">
            <header className="border-b border-mt-border/40 bg-mt-bg-soft/50 px-6 py-4">
              <h2 className="text-base leading-6 font-bold text-mt-text-primary">
                {listView.heading} <span className="ml-1 text-mt-primary">{applicants.length}</span>
              </h2>
            </header>

            {applicants.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-base font-bold text-mt-text-primary">{listView.emptyTitle}</p>
                <p className="mt-2 text-sm text-mt-text-secondary">{listView.emptyDescription}</p>
              </div>
            ) : (
              <ul>
                {applicants.map((applicant, index) => {
                  const isRecruitmentFull = isPendingList && applicant.isRecruitmentFull === true;
                  const isDecisionLoading = decisionLoadingId === applicant.id;

                  return (
                    <li
                      key={applicant.id}
                      className={`${index === 0 ? '' : 'border-t border-mt-border/40'} px-6 py-6`}
                    >
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                        <div className="flex min-w-0 gap-4 lg:w-52">
                          <ProfileAvatar
                            name={applicant.name}
                            imageUrl={applicant.avatarUrl}
                            sizeClassName="h-14 w-14"
                            shape="rounded"
                            textClassName="text-base"
                            className="bg-mt-border text-mt-text-secondary"
                          />

                          <div className="min-w-0 space-y-0.5">
                            <p className="truncate text-xl leading-7 font-bold text-mt-text-primary">
                              {applicant.name}
                            </p>
                            <p className="text-sm leading-5 font-bold text-mt-primary">
                              {getJobFieldLabel(applicant.position)}
                            </p>
                            <p className="text-xs leading-4 text-mt-text-secondary">
                              {applicant.specialty}
                            </p>
                            {isPendingList &&
                            typeof applicant.currentCount === 'number' &&
                            typeof applicant.recruitmentCount === 'number' ? (
                              <p className="text-xs leading-4 text-mt-text-secondary">
                                현재 {applicant.currentCount}/{applicant.recruitmentCount}명
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs leading-4 text-mt-text-secondary">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" aria-hidden strokeWidth={1.8} />
                              {applicant.appliedAt}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" aria-hidden strokeWidth={1.8} />
                              {applicant.email}
                            </span>
                            {isRecruitmentFull ? (
                              <span className="rounded-full bg-mt-bg-soft px-2 py-1 font-bold text-mt-hero-blue">
                                정원 마감
                              </span>
                            ) : null}
                          </div>

                          <div className="max-h-36 min-w-0 overflow-hidden rounded-xl bg-mt-bg-soft px-3 py-3 text-sm leading-6 text-mt-text-nav">
                            <MarkdownContent
                              value={applicant.introduction}
                              emptyText="아직 자기소개가 비어 있어요."
                              className="space-y-2 text-sm leading-6"
                            />
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            <button
                              type="button"
                              onClick={() => void handleOpenDetail(applicant)}
                              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-mt-border bg-mt-white px-4 text-sm leading-5 font-bold text-mt-text-nav transition-colors hover:bg-mt-bg-soft"
                            >
                              <ExternalLink className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                              상세 보기
                            </button>

                            <div className="h-6 w-px bg-mt-border" aria-hidden />

                            {isPendingList ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handleDecision(applicant, 'ACCEPTED')}
                                  disabled={decisionLoadingId !== null || isRecruitmentFull}
                                  title={
                                    isRecruitmentFull ? '모집 정원이 가득 찼습니다.' : undefined
                                  }
                                  data-cy={`project-applicant-approve-${applicant.id}`}
                                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-mt-primary px-4 text-sm leading-5 font-bold text-mt-white shadow-sm transition-colors hover:bg-mt-logo-blue disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <CheckCircle2 className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                                  {isRecruitmentFull
                                    ? '정원 마감'
                                    : isDecisionLoading
                                      ? '처리 중'
                                      : '승인'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setRejectTarget(applicant)}
                                  disabled={decisionLoadingId !== null}
                                  data-cy={`project-applicant-reject-${applicant.id}`}
                                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-mt-border bg-mt-white px-4 text-sm leading-5 font-bold text-mt-hero-blue transition-colors hover:bg-mt-bg-soft disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <XCircle className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                                  {isDecisionLoading ? '처리 중' : '거절'}
                                </button>
                              </>
                            ) : (
                              <DecisionRecord status={listStatus} decidedAt={applicant.decidedAt} />
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>

      <ConfirmModal
        isOpen={rejectTarget !== null}
        title="지원을 거절할까요?"
        description={
          <>
            <span className="font-bold">{rejectTarget?.name}</span>님의 지원을 거절하면 되돌릴 수
            없어요. 거절한 지원자는 &apos;거절됨&apos; 탭에서 다시 볼 수 있어요.
          </>
        }
        closeLabel="취소"
        confirmLabel={decisionLoadingId !== null ? '거절 중' : '거절하기'}
        confirmTone="danger"
        isSubmitting={decisionLoadingId !== null}
        confirmButtonDataCy="project-applicant-reject-confirm"
        onClose={() => setRejectTarget(null)}
        onConfirm={async () => {
          if (!rejectTarget) {
            return;
          }

          await handleDecision(rejectTarget, 'REJECTED');
          setRejectTarget(null);
        }}
      />

      <ProjectApplicantDetailModal
        applicant={detailApplicant ?? selectedApplicant}
        isOpen={selectedApplicant !== null}
        isLoading={isDetailLoading}
        errorMessage={detailErrorMessage}
        onClose={closeDetail}
      />
    </ProjectManageShell>
  );
}
