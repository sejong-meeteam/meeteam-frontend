'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, Github, Lock, Send, ShieldCheck, Unlink } from 'lucide-react';
import { useAuthRequiredModal } from '@/components/features/auth/useAuthRequiredModal';
import ProjectManageShell from '@/components/features/project/manage/ProjectManageShell';
import BaseButton from '@/components/shared/BaseButton';
import ConfirmModal from '@/components/shared/ConfirmModal';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import ToastMessage from '@/components/shared/ToastMessage';
import { useToastStore } from '@/stores/useToastStore';
import type {
  GithubAccessStatus,
  GithubCollaborator,
  GithubRepository,
  ProjectGithubConnection,
  ProjectGithubSettings,
} from '@/types/github';
import {
  fetchGithubAppInstallUrl,
  fetchInstallableGithubRepositories,
  fetchProjectGithubCollaborators,
  fetchProjectGithubConnection,
  inviteProjectGithubCollaborator,
  linkProjectGithubRepository,
  unlinkProjectGithubRepository,
  updateProjectGithubSettings,
} from './githubApi';
import { ACCESS_STATUS_LABEL, formatRelativeTime } from './githubFormat';

const ACCESS_STATUS_CLASS: Record<GithubAccessStatus, string> = {
  ACTIVE: 'bg-mt-mint text-mt-white',
  INVITED: 'bg-mt-border text-mt-primary',
  NOT_INVITED: 'bg-mt-bg-soft text-mt-text-secondary',
  NO_GITHUB_ACCOUNT: 'bg-mt-bg-soft text-mt-text-secondary',
  FAILED: 'bg-mt-danger-soft text-mt-danger',
};

const SETTING_COPY: Record<keyof ProjectGithubSettings, { title: string; description: string }> = {
  autoInviteOnApproval: {
    title: '지원 승인 시 저장소에 자동 초대',
    description: 'GitHub 계정을 연결한 지원자를 승인하면 저장소 협업자 초대를 바로 보내요.',
  },
  autoRevokeOnRemoval: {
    title: '팀원 방출·탈퇴 시 저장소 권한 회수',
    description: '팀에서 나간 멤버의 저장소 접근 권한을 자동으로 제거해요.',
  },
};

const CARD_CLASS =
  'flex w-full min-w-0 flex-col gap-4 rounded-3xl border border-mt-border bg-mt-white p-4 shadow-sm sm:p-6';

function StepHeading({ step, title, done }: { step: number; title: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs leading-4 font-bold ${done ? 'bg-mt-mint text-mt-white' : 'bg-mt-badge-bg text-mt-primary'}`}
      >
        {done ? <CheckCircle2 className="h-4 w-4" aria-hidden strokeWidth={2} /> : step}
      </span>
      <h2 className="text-lg leading-7 font-bold text-mt-text-primary">{title}</h2>
    </div>
  );
}

function SettingSwitch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${checked ? 'bg-action-primary' : 'bg-mt-border'}`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-mt-white shadow-sm transition-transform ${checked ? 'translate-x-5.5' : 'translate-x-0.5'}`}
        aria-hidden
      />
    </button>
  );
}

function RepositoryCard({ repository }: { repository: GithubRepository }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Github className="mt-0.5 h-5 w-5 shrink-0 text-mt-text-primary" aria-hidden />
      <div className="min-w-0">
        <a
          href={repository.htmlUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex max-w-full items-center gap-1 break-all text-sm leading-5 font-bold text-mt-primary hover:underline"
        >
          {repository.isPrivate ? (
            <Lock className="h-3.5 w-3.5 shrink-0" aria-label="비공개 저장소" />
          ) : null}
          {repository.fullName}
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden strokeWidth={1.8} />
        </a>
        {repository.description ? (
          <p className="mt-0.5 text-sm leading-6 text-mt-text-secondary">
            {repository.description}
          </p>
        ) : null}
        <p className="mt-0.5 text-xs leading-4 text-mt-text-secondary">
          기본 브랜치 {repository.defaultBranch}
        </p>
      </div>
    </div>
  );
}

export default function ProjectManageGithub({ projectId }: { projectId: string }) {
  const handleAuthRequired = useAuthRequiredModal();
  const showToast = useToastStore((state) => state.showToast);
  const [connection, setConnection] = useState<ProjectGithubConnection | null>(null);
  const [repositories, setRepositories] = useState<GithubRepository[] | null>(null);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<number | null>(null);
  const [collaboratorResult, setCollaboratorResult] = useState<{
    repositoryId: number;
    items: GithubCollaborator[];
  } | null>(null);
  const [invitingMemberId, setInvitingMemberId] = useState<number | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const redirectPath = `/projects/${projectId}/manage/github`;

  const handleError = useCallback(
    (error: unknown, fallback: string) => {
      if (handleAuthRequired(error, { redirectPath })) return;
      setErrorMessage(error instanceof Error ? error.message : fallback);
    },
    [handleAuthRequired, redirectPath],
  );

  useEffect(() => {
    let active = true;

    fetchProjectGithubConnection(projectId)
      .then((nextConnection) => {
        if (active) setConnection(nextConnection);
      })
      .catch((error: unknown) => {
        if (active) handleError(error, 'GitHub 연동 정보를 불러오지 못했습니다.');
      });

    return () => {
      active = false;
    };
  }, [handleError, projectId]);

  // GitHub App 설치 후 돌아온 경우 안내하고 쿼리를 정리한다.
  useEffect(() => {
    const url = new URL(window.location.href);

    if (url.searchParams.get('installed') !== '1') return;

    showToast({
      tone: 'success',
      message: 'GitHub App 설치가 완료됐어요. 저장소를 선택해 주세요.',
    });
    url.searchParams.delete('installed');
    window.history.replaceState(null, '', url.pathname + url.search);
  }, [showToast]);

  const isInstalled = connection?.isAppInstalled ?? false;
  const repository = connection?.repository ?? null;
  const collaborators =
    repository && collaboratorResult?.repositoryId === repository.id
      ? collaboratorResult.items
      : null;

  useEffect(() => {
    if (!isInstalled || repository) {
      return;
    }

    let active = true;

    fetchInstallableGithubRepositories(projectId)
      .then((items) => {
        if (active) setRepositories(items);
      })
      .catch((error: unknown) => {
        if (active) handleError(error, '연결 가능한 저장소를 불러오지 못했습니다.');
      });

    return () => {
      active = false;
    };
  }, [handleError, isInstalled, projectId, repository]);

  useEffect(() => {
    if (!repository) {
      return;
    }

    let active = true;

    fetchProjectGithubCollaborators(projectId)
      .then((items) => {
        if (active) setCollaboratorResult({ repositoryId: repository.id, items });
      })
      .catch((error: unknown) => {
        if (active) handleError(error, '저장소 접근 현황을 불러오지 못했습니다.');
      });

    return () => {
      active = false;
    };
  }, [handleError, projectId, repository]);

  const handleInstall = async () => {
    try {
      setIsBusy(true);
      setErrorMessage(null);
      window.location.assign(await fetchGithubAppInstallUrl(projectId));
    } catch (error) {
      handleError(error, 'GitHub App 설치 주소를 받지 못했습니다.');
      setIsBusy(false);
    }
  };

  const handleLink = async () => {
    if (selectedRepositoryId === null) return;

    try {
      setIsBusy(true);
      setErrorMessage(null);
      setConnection(await linkProjectGithubRepository(projectId, selectedRepositoryId));
      showToast({ tone: 'success', message: '저장소를 연결했어요.' });
    } catch (error) {
      handleError(error, '저장소를 연결하지 못했습니다.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleUnlink = async () => {
    try {
      setIsBusy(true);
      setErrorMessage(null);
      setConnection(await unlinkProjectGithubRepository(projectId));
      setSelectedRepositoryId(null);
      setIsUnlinkModalOpen(false);
      showToast({ tone: 'success', message: '저장소 연결을 해제했어요.' });
    } catch (error) {
      handleError(error, '저장소 연결을 해제하지 못했습니다.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSettingChange = async (key: keyof ProjectGithubSettings, value: boolean) => {
    if (!connection) return;

    const previous = connection.settings;
    const next = { ...previous, [key]: value };

    setConnection({ ...connection, settings: next });

    try {
      setErrorMessage(null);
      const saved = await updateProjectGithubSettings(projectId, next);
      setConnection((current) => (current ? { ...current, settings: saved } : current));
    } catch (error) {
      setConnection((current) => (current ? { ...current, settings: previous } : current));
      handleError(error, '연동 설정을 저장하지 못했습니다.');
    }
  };

  const handleInvite = async (memberId: number) => {
    try {
      setInvitingMemberId(memberId);
      setErrorMessage(null);
      const updated = await inviteProjectGithubCollaborator(projectId, memberId);
      setCollaboratorResult((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) => (item.memberId === memberId ? updated : item)),
            }
          : current,
      );
      showToast({ tone: 'success', message: `${updated.name}님에게 저장소 초대를 보냈어요.` });
    } catch (error) {
      handleError(error, '저장소 초대를 보내지 못했습니다.');
    } finally {
      setInvitingMemberId(null);
    }
  };

  return (
    <ProjectManageShell projectId={projectId} activeTab="github">
      <ToastMessage message={errorMessage} />

      {!connection ? (
        <div className="space-y-4">
          <SkeletonBlock className="h-36 w-full rounded-3xl" />
          <SkeletonBlock className="h-56 w-full rounded-3xl" />
        </div>
      ) : (
        <div className="flex flex-col gap-6" data-cy="project-manage-github">
          <section className={CARD_CLASS}>
            <StepHeading step={1} title="GitHub App 설치" done={isInstalled} />
            <p className="text-sm leading-6 text-mt-text-secondary">
              meeTeam GitHub App을 저장소가 있는 계정이나 조직에 설치하면, 개발 현황을 가져오고 팀원
              초대·권한 회수를 대신 처리할 수 있어요. 코드 내용은 읽지 않아요.
            </p>
            {isInstalled ? (
              <p className="inline-flex items-center gap-1.5 text-sm leading-5 font-bold text-mt-mint">
                <ShieldCheck className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                설치 완료
              </p>
            ) : (
              <BaseButton onClick={() => void handleInstall()} disabled={isBusy} className="gap-2">
                <Github className="h-4 w-4" aria-hidden />
                GitHub App 설치하기
              </BaseButton>
            )}
          </section>

          <section className={CARD_CLASS}>
            <StepHeading step={2} title="저장소 연결" done={Boolean(repository)} />
            {repository ? (
              <div className="flex flex-col gap-4 rounded-2xl border border-mt-border bg-mt-bg-soft p-4 sm:flex-row sm:items-center sm:justify-between">
                <RepositoryCard repository={repository} />
                <BaseButton
                  variant="gray"
                  size="S"
                  onClick={() => setIsUnlinkModalOpen(true)}
                  disabled={isBusy}
                  className="shrink-0 gap-1.5"
                >
                  <Unlink className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                  연결 해제
                </BaseButton>
              </div>
            ) : !isInstalled ? (
              <p className="text-sm leading-6 text-mt-text-secondary">
                GitHub App을 설치하면 연결할 저장소를 고를 수 있어요.
              </p>
            ) : repositories === null ? (
              <SkeletonBlock className="h-32 w-full" />
            ) : repositories.length === 0 ? (
              <p className="text-sm leading-6 text-mt-text-secondary">
                연결할 수 있는 저장소가 없어요. GitHub App 설정에서 저장소 접근 권한을 추가해
                주세요.
              </p>
            ) : (
              <fieldset className="flex flex-col gap-2" disabled={isBusy}>
                <legend className="sr-only">연결할 저장소</legend>
                {repositories.map((item) => (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${selectedRepositoryId === item.id ? 'border-mt-primary bg-mt-badge-bg' : 'border-mt-border bg-mt-white hover:bg-mt-bg-soft'}`}
                  >
                    <input
                      type="radio"
                      name="github-repository"
                      value={item.id}
                      checked={selectedRepositoryId === item.id}
                      onChange={() => setSelectedRepositoryId(item.id)}
                      className="mt-1 accent-action-primary"
                    />
                    <RepositoryCard repository={item} />
                  </label>
                ))}
                <BaseButton
                  onClick={() => void handleLink()}
                  disabled={selectedRepositoryId === null || isBusy}
                  className="mt-2 self-end"
                >
                  연결하기
                </BaseButton>
              </fieldset>
            )}
          </section>

          {repository ? (
            <>
              <section className={CARD_CLASS}>
                <h2 className="text-lg leading-7 font-bold text-mt-text-primary">
                  팀원 저장소 권한 자동화
                </h2>
                <ul className="divide-y divide-mt-border">
                  {(Object.keys(SETTING_COPY) as Array<keyof ProjectGithubSettings>).map((key) => (
                    <li
                      key={key}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm leading-5 font-bold text-mt-text-primary">
                          {SETTING_COPY[key].title}
                        </p>
                        <p className="mt-0.5 text-sm leading-6 text-mt-text-secondary">
                          {SETTING_COPY[key].description}
                        </p>
                      </div>
                      <SettingSwitch
                        checked={connection.settings[key]}
                        disabled={isBusy}
                        label={SETTING_COPY[key].title}
                        onChange={(value) => void handleSettingChange(key, value)}
                      />
                    </li>
                  ))}
                </ul>
              </section>

              <section className={CARD_CLASS} data-cy="project-manage-github-collaborators">
                <h2 className="text-lg leading-7 font-bold text-mt-text-primary">
                  팀원 저장소 접근 현황
                </h2>
                {collaborators === null ? (
                  <SkeletonBlock className="h-32 w-full" />
                ) : (
                  <ul className="divide-y divide-mt-border overflow-hidden rounded-2xl border border-mt-border">
                    {collaborators.map((item) => {
                      const canInvite =
                        !item.isLeader &&
                        item.githubLogin !== null &&
                        item.accessStatus !== 'ACTIVE';

                      return (
                        <li
                          key={item.memberId}
                          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <ProfileAvatar
                              name={item.name}
                              imageUrl={item.profileImageUrl}
                              sizeClassName="h-10 w-10"
                              shape="rounded"
                              textClassName="text-sm"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm leading-5 font-bold text-mt-text-primary">
                                {item.name}
                                {item.isLeader ? (
                                  <span className="ml-1.5 text-xs font-bold text-mt-primary">
                                    리더
                                  </span>
                                ) : null}
                              </p>
                              <p className="text-xs leading-4 text-mt-text-secondary">
                                {item.githubLogin
                                  ? `@${item.githubLogin}`
                                  : '설정에서 GitHub 계정을 연결해야 초대할 수 있어요.'}
                                {item.accessStatus === 'INVITED' && item.invitedAt
                                  ? ` · ${formatRelativeTime(item.invitedAt)} 초대`
                                  : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2 pl-13 sm:pl-0">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs leading-4 font-bold ${ACCESS_STATUS_CLASS[item.accessStatus]}`}
                            >
                              {ACCESS_STATUS_LABEL[item.accessStatus]}
                            </span>
                            {canInvite ? (
                              <BaseButton
                                variant="gray"
                                size="XS"
                                onClick={() => void handleInvite(item.memberId)}
                                disabled={invitingMemberId !== null}
                                className="gap-1"
                              >
                                <Send className="h-3.5 w-3.5" aria-hidden strokeWidth={1.8} />
                                {item.accessStatus === 'NOT_INVITED'
                                  ? '초대 보내기'
                                  : '다시 보내기'}
                              </BaseButton>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </>
          ) : null}
        </div>
      )}

      <ConfirmModal
        isOpen={isUnlinkModalOpen}
        title="저장소 연결을 해제할까요?"
        description="개발 현황과 주간 리포트가 더 이상 표시되지 않아요. 이미 초대된 팀원의 저장소 권한은 그대로 유지돼요."
        closeLabel="취소"
        confirmLabel={isBusy ? '해제 중' : '연결 해제'}
        isSubmitting={isBusy}
        onClose={() => setIsUnlinkModalOpen(false)}
        onConfirm={() => void handleUnlink()}
      />
    </ProjectManageShell>
  );
}
