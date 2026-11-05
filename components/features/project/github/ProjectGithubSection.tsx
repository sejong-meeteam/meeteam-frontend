'use client';

import { useEffect, useState } from 'react';
import { Github, Settings } from 'lucide-react';
import AuthLink from '@/components/features/auth/AuthLink';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import type { ProjectGithubActivity, ProjectGithubProgress } from '@/types/github';
import GithubActivityOverview from './GithubActivityOverview';
import GithubTeamProgress from './GithubTeamProgress';
import GithubWeeklyReport from './GithubWeeklyReport';
import { fetchProjectGithubActivity, fetchProjectGithubProgress } from './githubApi';

type ProjectGithubSectionProps = {
  projectId: string;
  projectTitle: string;
  /** 팀원(리더 포함)에게만 PR·기여도·주간 리포트를 보여준다. */
  canViewTeamProgress: boolean;
  canManageProject: boolean;
};

type ActivityState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; activity: ProjectGithubActivity | null };

type ProgressState = ProjectGithubProgress | 'error' | null;

export default function ProjectGithubSection({
  projectId,
  projectTitle,
  canViewTeamProgress,
  canManageProject,
}: ProjectGithubSectionProps) {
  const [activityResult, setActivityResult] = useState<{
    projectId: string;
    state: ActivityState;
  } | null>(null);
  const [progressResult, setProgressResult] = useState<{
    projectId: string;
    progress: ProgressState;
  } | null>(null);
  const activityState: ActivityState =
    activityResult?.projectId === projectId ? activityResult.state : { status: 'loading' };
  const isLinked = activityState.status === 'ready' && activityState.activity !== null;
  const progress: ProgressState =
    progressResult?.projectId === projectId ? progressResult.progress : null;

  useEffect(() => {
    let active = true;

    fetchProjectGithubActivity(projectId)
      .then((activity) => {
        if (active) setActivityResult({ projectId, state: { status: 'ready', activity } });
      })
      .catch((error: unknown) => {
        if (active) {
          setActivityResult({
            projectId,
            state: {
              status: 'error',
              message: error instanceof Error ? error.message : '개발 현황을 불러오지 못했습니다.',
            },
          });
        }
      });

    return () => {
      active = false;
    };
  }, [projectId]);

  useEffect(() => {
    if (!canViewTeamProgress || !isLinked) {
      return;
    }

    let active = true;

    fetchProjectGithubProgress(projectId)
      .then((nextProgress) => {
        if (active) setProgressResult({ projectId, progress: nextProgress });
      })
      .catch(() => {
        if (active) setProgressResult({ projectId, progress: 'error' });
      });

    return () => {
      active = false;
    };
  }, [canViewTeamProgress, isLinked, projectId]);

  if (activityState.status === 'loading') {
    return (
      <div className="space-y-4" aria-busy>
        <SkeletonBlock className="h-72 w-full rounded-3xl" />
        {canViewTeamProgress ? <SkeletonBlock className="h-56 w-full rounded-3xl" /> : null}
      </div>
    );
  }

  if (activityState.status === 'error') {
    return (
      <p className="rounded-3xl border border-mt-border bg-mt-white px-6 py-12 text-center text-sm text-mt-text-secondary shadow-sm">
        {activityState.message}
      </p>
    );
  }

  if (!activityState.activity) {
    return (
      <section
        className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-mt-border bg-mt-white px-6 py-12 text-center"
        data-cy="github-empty-state"
      >
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-mt-bg-soft text-mt-text-secondary">
          <Github className="h-6 w-6" aria-hidden strokeWidth={1.8} />
        </span>
        <h2 className="text-lg leading-7 font-bold text-mt-text-primary">
          아직 연결된 GitHub 저장소가 없어요.
        </h2>
        <p className="text-sm leading-6 text-mt-text-secondary">
          {canManageProject
            ? '저장소를 연결하면 개발 진행 상황이 프로젝트 페이지에 자동으로 표시돼요.'
            : '리더가 저장소를 연결하면 이곳에서 개발 진행 상황을 볼 수 있어요.'}
        </p>
        {canManageProject ? (
          <AuthLink
            href={`/projects/${projectId}/manage/github`}
            className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl bg-action-primary px-4 text-sm leading-5 font-bold text-mt-white shadow-sm transition-colors hover:bg-action-primary/90"
          >
            <Settings className="h-4 w-4" aria-hidden strokeWidth={1.8} />
            저장소 연결하기
          </AuthLink>
        ) : null}
      </section>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <GithubActivityOverview activity={activityState.activity} />
      {canViewTeamProgress ? (
        <>
          {progress === null ? (
            <SkeletonBlock className="h-56 w-full rounded-3xl" />
          ) : progress !== 'error' ? (
            <GithubTeamProgress progress={progress} />
          ) : null}
          <GithubWeeklyReport projectId={projectId} projectTitle={projectTitle} />
        </>
      ) : null}
    </div>
  );
}
