'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useId, useRef, useState } from 'react';
import { z } from 'zod';

import { useAuthRequiredModal } from '@/components/features/auth/useAuthRequiredModal';
import BaseButton from '@/components/shared/BaseButton';
import BaseField from '@/components/shared/BaseField';
import BaseModal from '@/components/shared/BaseModal';
import BaseSelect from '@/components/shared/BaseSelect';
import BaseTextarea from '@/components/shared/BaseTextarea';
import { formatJobRole } from '@/components/shared/jobRoleFormat';
import { useToastStore } from '@/stores/useToastStore';
import type { ProposableProject } from '@/types/proposal';

import { fetchProposableProjects, sendProjectProposal } from './proposalApi';
import { PROPOSAL_MESSAGE_MAX_LENGTH, projectProposalRequestSchema } from './schema';

export type ProposalTarget = {
  memberId: number;
  name: string;
  representativePosition: string | null;
};

type ProjectProposalDialogProps = {
  isOpen: boolean;
  target: ProposalTarget;
  onClose: () => void;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; projects: ProposableProject[] };

type FieldErrors = Partial<Record<'jobPositionId' | 'message', string>>;

export default function ProjectProposalDialog({ isOpen, ...props }: ProjectProposalDialogProps) {
  // Mount only while open so every open starts from a fresh fetch and an empty form.
  return isOpen ? <ProposalDialog {...props} /> : null;
}

function ProposalDialog({ target, onClose }: Omit<ProjectProposalDialogProps, 'isOpen'>) {
  const router = useRouter();
  const handleAuthRequired = useAuthRequiredModal();
  const showToast = useToastStore((state) => state.showToast);
  const titleId = useId();
  const descriptionId = useId();
  const projectFieldId = useId();
  const positionFieldId = useId();
  const messageFieldId = useId();
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [projectId, setProjectId] = useState<number | null>(null);
  const [jobPositionId, setJobPositionId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    let active = true;

    fetchProposableProjects(target.memberId)
      .then((projects) => {
        if (!active) return;
        const initialProject =
          projects.find((project) => !project.hasPendingProposal) ?? projects[0];
        setLoadState({ status: 'ready', projects });
        setProjectId(initialProject?.projectId ?? null);
        setJobPositionId(pickPosition(initialProject, target.representativePosition));
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (handleAuthRequired(error)) {
          closeRef.current();
          return;
        }
        setLoadState({
          status: 'error',
          message:
            error instanceof Error ? error.message : '제안할 프로젝트를 불러오지 못했습니다.',
        });
      });

    return () => {
      active = false;
    };
  }, [handleAuthRequired, target.memberId, target.representativePosition]);

  const projects = loadState.status === 'ready' ? loadState.projects : [];
  const selectedProject = projects.find((project) => project.projectId === projectId);
  const isAlreadyProposed = selectedProject?.hasPendingProposal ?? false;

  const handleProjectChange = (value: string) => {
    const nextProject = projects.find((project) => project.projectId === Number(value));
    setProjectId(nextProject?.projectId ?? null);
    setJobPositionId(pickPosition(nextProject, target.representativePosition));
    setFieldErrors({});
    setSubmitError(null);
  };

  const refreshProjects = async () => {
    try {
      setLoadState({ status: 'ready', projects: await fetchProposableProjects(target.memberId) });
    } catch {
      // Keep the current list; the submit error already tells the user what failed.
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedProject || isAlreadyProposed || isSubmitting) {
      return;
    }

    const parsed = projectProposalRequestSchema.safeParse({
      memberId: target.memberId,
      jobPositionId: jobPositionId ?? 0,
      message,
    });

    if (!parsed.success) {
      const { fieldErrors: errors } = z.flattenError(parsed.error);
      setFieldErrors({ jobPositionId: errors.jobPositionId?.[0], message: errors.message?.[0] });
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await sendProjectProposal(selectedProject.projectId, parsed.data);
      showToast({ tone: 'success', message: `${target.name}님에게 제안을 보냈어요.` });
      onClose();
    } catch (error) {
      if (handleAuthRequired(error)) {
        onClose();
        return;
      }

      setSubmitError(error instanceof Error ? error.message : '제안을 보내지 못했습니다.');
      await refreshProjects();
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToCreateProject = () => {
    onClose();
    router.push('/projects/create');
  };

  return (
    <BaseModal
      isOpen
      onClose={isSubmitting ? () => undefined : onClose}
      labelledBy={titleId}
      describedBy={descriptionId}
    >
      <div className="rounded-2xl bg-mt-white p-6 shadow-2xl">
        {loadState.status === 'ready' && projects.length === 0 ? (
          <>
            <h2 id={titleId} className="text-xl font-extrabold text-mt-text-primary">
              모집 중인 프로젝트가 없어요
            </h2>
            <p id={descriptionId} className="mt-2 text-sm leading-6 text-mt-text-secondary">
              제안은 내가 리더로 모집 중인 프로젝트로 보낼 수 있어요. 프로젝트를 만들고{' '}
              {target.name}님에게 함께하자고 제안해 보세요.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <BaseButton size="M" variant="gray" onClick={onClose}>
                닫기
              </BaseButton>
              <BaseButton size="M" onClick={goToCreateProject}>
                프로젝트 만들기
              </BaseButton>
            </div>
          </>
        ) : (
          <>
            <h2 id={titleId} className="text-xl font-extrabold text-mt-text-primary">
              {target.name}님에게 합류 제안
            </h2>
            <p id={descriptionId} className="mt-2 text-sm leading-6 text-mt-text-secondary">
              받는 분은 프로젝트와 포지션을 확인하고 지원 여부를 직접 정해요.
            </p>

            {loadState.status === 'loading' ? (
              <p className="mt-6 flex items-center gap-2 text-sm leading-5 text-mt-text-secondary">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden strokeWidth={2} />
                모집 중인 프로젝트를 불러오고 있어요.
              </p>
            ) : null}

            {loadState.status === 'error' ? (
              <>
                <p role="alert" className="mt-6 text-sm leading-6 text-feedback-error">
                  {loadState.message}
                </p>
                <div className="mt-6 flex justify-end">
                  <BaseButton size="M" variant="gray" onClick={onClose}>
                    닫기
                  </BaseButton>
                </div>
              </>
            ) : null}

            {loadState.status === 'ready' ? (
              <form className="mt-5 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
                <BaseField label="프로젝트" htmlFor={projectFieldId}>
                  <BaseSelect
                    id={projectFieldId}
                    selectSize="M"
                    full
                    value={projectId === null ? '' : String(projectId)}
                    onChange={(event) => handleProjectChange(event.target.value)}
                    disabled={isSubmitting}
                    options={projects.map((project) => ({
                      value: String(project.projectId),
                      label: project.hasPendingProposal
                        ? `${project.projectName} · 제안 보냄`
                        : project.projectName,
                    }))}
                  />
                  {isAlreadyProposed ? (
                    <p className="flex items-start gap-1.5 text-sm leading-5 text-mt-text-secondary">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-mt-mint"
                        aria-hidden
                        strokeWidth={2}
                      />
                      이 프로젝트로 이미 제안을 보냈어요. {target.name}님이 확인할 때까지 기다려
                      주세요.
                    </p>
                  ) : null}
                </BaseField>

                <BaseField
                  label="포지션"
                  htmlFor={positionFieldId}
                  errorText={fieldErrors.jobPositionId}
                >
                  <BaseSelect
                    id={positionFieldId}
                    selectSize="M"
                    full
                    value={jobPositionId === null ? '' : String(jobPositionId)}
                    onChange={(event) => {
                      setJobPositionId(Number(event.target.value));
                      setFieldErrors((current) => ({ ...current, jobPositionId: undefined }));
                    }}
                    disabled={isSubmitting || isAlreadyProposed}
                    options={(selectedProject?.openPositions ?? []).map((position) => ({
                      value: String(position.jobPositionId),
                      label: formatJobRole(position.jobFieldName, position.jobPositionName),
                    }))}
                  />
                </BaseField>

                <BaseField
                  label="메시지"
                  htmlFor={messageFieldId}
                  required={false}
                  errorText={fieldErrors.message}
                  hintText={`${message.length}/${PROPOSAL_MESSAGE_MAX_LENGTH}자`}
                >
                  <BaseTextarea
                    id={messageFieldId}
                    value={message}
                    onChange={(event) => {
                      setMessage(event.target.value);
                      setFieldErrors((current) => ({ ...current, message: undefined }));
                    }}
                    disabled={isSubmitting || isAlreadyProposed}
                    placeholder="프로필의 어떤 점이 프로젝트와 잘 맞는지 짧게 적어주세요."
                    aria-invalid={Boolean(fieldErrors.message)}
                    aria-describedby={
                      fieldErrors.message ? `${messageFieldId}-error` : `${messageFieldId}-hint`
                    }
                  />
                </BaseField>

                {submitError ? (
                  <p role="alert" className="text-sm leading-5 text-feedback-error">
                    {submitError}
                  </p>
                ) : null}

                <div className="flex justify-end gap-2">
                  <BaseButton size="M" variant="gray" onClick={onClose} disabled={isSubmitting}>
                    취소
                  </BaseButton>
                  <BaseButton
                    type="submit"
                    size="M"
                    disabled={isSubmitting || isAlreadyProposed}
                    data-cy="proposal-submit-button"
                  >
                    {isAlreadyProposed ? '제안 보냄' : isSubmitting ? '보내는 중' : '제안 보내기'}
                  </BaseButton>
                </div>
              </form>
            ) : null}
          </>
        )}
      </div>
    </BaseModal>
  );
}

function pickPosition(project: ProposableProject | undefined, preferredName: string | null) {
  const positions = project?.openPositions ?? [];
  const preferred = positions.find((position) => position.jobPositionName === preferredName);

  return (preferred ?? positions[0])?.jobPositionId ?? null;
}
