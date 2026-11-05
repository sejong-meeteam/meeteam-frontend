import type { ReactNode } from 'react';
import { CircleDot, GitPullRequest, Github, Lock, Star } from 'lucide-react';
import AuthLink from '@/components/features/auth/AuthLink';
import IntroSectionHeading from '@/components/features/project/detail/project-intro/IntroSectionHeading';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import type { ProjectGithubActivity } from '@/types/github';
import GithubActivityBadge from './GithubActivityBadge';
import { formatRelativeTime } from './githubFormat';

const LANGUAGE_COLOR_CLASSES = [
  'bg-mt-primary',
  'bg-mt-logo-blue',
  'bg-mt-mint',
  'bg-mt-hero-blue',
  'bg-mt-text-secondary',
];

function StatItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl border border-mt-border bg-mt-bg-soft px-4 py-3">
      <dt className="flex items-center gap-1.5 text-xs leading-4 font-bold text-mt-text-secondary">
        {icon}
        {label}
      </dt>
      <dd className="text-xl leading-7 font-extrabold text-mt-text-primary">{value}</dd>
    </div>
  );
}

function WeeklyCommitChart({ weeklyCommits }: { weeklyCommits: number[] }) {
  const max = Math.max(1, ...weeklyCommits);
  const total = weeklyCommits.reduce((sum, value) => sum + value, 0);

  return (
    <figure className="flex min-w-0 flex-col gap-3">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-sm leading-5 font-bold text-mt-text-primary">최근 8주 커밋</span>
        <span className="text-xs leading-4 font-bold text-mt-text-secondary">총 {total}건</span>
      </figcaption>
      <ol className="flex h-28 items-end gap-2" aria-label="주간 커밋 수">
        {weeklyCommits.map((value, index) => {
          const isLatest = index === weeklyCommits.length - 1;
          const weeksAgo = weeklyCommits.length - 1 - index;

          return (
            <li
              key={index}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
              aria-label={`${weeksAgo === 0 ? '이번 주' : `${weeksAgo}주 전`} ${value}건`}
            >
              <span className="text-[10px] leading-3 font-bold text-mt-text-secondary">
                {value}
              </span>
              <span
                className={`w-full rounded-md ${isLatest ? 'bg-mt-primary' : 'bg-mt-logo-blue/40'}`}
                style={{ height: `${Math.max(4, (value / max) * 100)}%` }}
              />
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

export default function GithubActivityOverview({ activity }: { activity: ProjectGithubActivity }) {
  const { repository } = activity;

  return (
    <section
      className="flex w-full min-w-0 flex-col gap-5 rounded-3xl border border-mt-border bg-mt-white p-4 shadow-sm sm:p-6"
      data-cy="github-activity-overview"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <IntroSectionHeading
            title="개발 현황"
            icon={<Github className="h-5 w-5" aria-hidden strokeWidth={1.8} />}
          />
          <a
            href={repository.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 break-all text-sm leading-5 font-bold text-mt-primary hover:underline"
          >
            {repository.isPrivate ? (
              <Lock className="h-3.5 w-3.5 shrink-0" aria-label="비공개 저장소" />
            ) : null}
            {repository.fullName}
          </a>
          {repository.description ? (
            <p className="text-sm leading-6 text-mt-text-secondary">{repository.description}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          <GithubActivityBadge level={activity.activityLevel} />
          <span className="text-xs leading-4 font-medium text-mt-text-secondary">
            마지막 커밋 {formatRelativeTime(activity.lastPushedAt)}
          </span>
        </div>
      </div>

      <dl className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3">
        <StatItem
          icon={<GitPullRequest className="h-3.5 w-3.5" aria-hidden strokeWidth={1.8} />}
          label="열린 PR"
          value={activity.openPullRequestCount}
        />
        <StatItem
          icon={<CircleDot className="h-3.5 w-3.5" aria-hidden strokeWidth={1.8} />}
          label="열린 이슈"
          value={activity.openIssueCount}
        />
        <StatItem
          icon={<Star className="h-3.5 w-3.5" aria-hidden strokeWidth={1.8} />}
          label="스타"
          value={repository.stars}
        />
      </dl>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <WeeklyCommitChart weeklyCommits={activity.weeklyCommits} />

        {activity.languages.length > 0 ? (
          <div className="flex min-w-0 flex-col gap-3">
            <span className="text-sm leading-5 font-bold text-mt-text-primary">사용 언어</span>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-mt-bg-soft">
              {activity.languages.map((language, index) => (
                <span
                  key={language.name}
                  className={LANGUAGE_COLOR_CLASSES[index % LANGUAGE_COLOR_CLASSES.length]}
                  style={{ width: `${language.percentage}%` }}
                />
              ))}
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {activity.languages.map((language, index) => (
                <li
                  key={language.name}
                  className="flex items-center gap-1.5 text-xs leading-4 font-bold text-mt-text-nav"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${LANGUAGE_COLOR_CLASSES[index % LANGUAGE_COLOR_CLASSES.length]}`}
                    aria-hidden
                  />
                  {language.name}
                  <span className="font-medium text-mt-text-secondary">
                    {language.percentage.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {activity.contributors.length > 0 ? (
        <div className="border-t border-mt-border pt-4">
          <p className="text-xs leading-4 font-bold text-mt-text-secondary">기여자</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {activity.contributors.map((contributor) => {
              const content = (
                <>
                  <ProfileAvatar
                    name={contributor.memberName ?? contributor.login}
                    imageUrl={contributor.avatarUrl}
                    sizeClassName="h-7 w-7"
                    shape="rounded"
                    textClassName="text-xs"
                  />
                  <span className="max-w-32 truncate text-sm leading-5 font-bold text-mt-text-primary">
                    {contributor.memberName ?? `@${contributor.login}`}
                  </span>
                  <span className="text-xs leading-4 font-medium text-mt-text-secondary">
                    커밋 {contributor.commits}
                  </span>
                </>
              );
              const className =
                'inline-flex h-9 min-w-0 items-center gap-2 rounded-full border border-mt-border bg-mt-bg-soft py-1 pr-3 pl-1';

              return (
                <li key={contributor.login}>
                  {contributor.memberId ? (
                    <AuthLink
                      href={`/profile/${contributor.memberId}`}
                      className={`${className} transition-colors hover:bg-mt-badge-bg`}
                    >
                      {content}
                    </AuthLink>
                  ) : (
                    <span className={className}>{content}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <p className="text-xs leading-4 text-mt-text-secondary">
        {formatRelativeTime(activity.syncedAt)} GitHub에서 동기화됨
      </p>
    </section>
  );
}
