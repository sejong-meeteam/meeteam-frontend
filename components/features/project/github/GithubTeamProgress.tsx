import { AlarmClock, GitPullRequest, UsersRound } from 'lucide-react';
import IntroSectionHeading from '@/components/features/project/detail/project-intro/IntroSectionHeading';
import type { GithubReviewState, ProjectGithubProgress } from '@/types/github';
import { REVIEW_STATE_LABEL, formatRelativeTime, formatShortDate } from './githubFormat';

const REVIEW_STATE_CLASS: Record<GithubReviewState, string> = {
  REVIEW_REQUIRED: 'bg-mt-border text-mt-primary',
  APPROVED: 'bg-mt-mint text-mt-white',
  CHANGES_REQUESTED: 'bg-mt-danger-soft text-mt-danger',
};

export default function GithubTeamProgress({ progress }: { progress: ProjectGithubProgress }) {
  const pullRequests = [...progress.pullRequests].sort(
    (a, b) => Number(b.isStale) - Number(a.isStale) || b.updatedAt.localeCompare(a.updatedAt),
  );
  const staleCount = pullRequests.filter((item) => item.isStale).length;
  const maxCommits = Math.max(1, ...progress.contributions.map((item) => item.commits));

  return (
    <section
      className="flex w-full min-w-0 flex-col gap-5 rounded-3xl border border-mt-border bg-mt-white p-4 shadow-sm sm:p-6"
      data-cy="github-team-progress"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <IntroSectionHeading
          title="팀 진행 현황"
          icon={<UsersRound className="h-5 w-5" aria-hidden strokeWidth={1.8} />}
        />
        <span className="rounded-full bg-mt-badge-bg px-2.5 py-1 text-xs leading-4 font-bold text-mt-primary">
          팀원에게만 보여요
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm leading-5 font-bold text-mt-text-primary">
            열린 PR {pullRequests.length}건
          </h3>
          {staleCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-mt-danger-soft px-2 py-0.5 text-xs leading-4 font-bold text-mt-danger">
              <AlarmClock className="h-3 w-3" aria-hidden strokeWidth={2} />
              멈춘 PR {staleCount}건
            </span>
          ) : null}
        </div>

        {pullRequests.length > 0 ? (
          <ul className="divide-y divide-mt-border overflow-hidden rounded-2xl border border-mt-border">
            {pullRequests.map((pullRequest) => (
              <li
                key={pullRequest.number}
                className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${pullRequest.isStale ? 'bg-mt-danger-soft/40' : 'bg-mt-white'}`}
              >
                <div className="flex min-w-0 items-start gap-2">
                  <GitPullRequest
                    className={`mt-0.5 h-4 w-4 shrink-0 ${pullRequest.isDraft ? 'text-mt-text-secondary' : 'text-mt-mint'}`}
                    aria-hidden
                    strokeWidth={1.8}
                  />
                  <div className="min-w-0">
                    <a
                      href={pullRequest.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block break-words text-sm leading-5 font-bold text-mt-text-primary hover:text-mt-primary hover:underline"
                    >
                      <span className="text-mt-text-secondary">#{pullRequest.number}</span>{' '}
                      {pullRequest.title}
                    </a>
                    <p className="mt-0.5 text-xs leading-4 text-mt-text-secondary">
                      {pullRequest.authorMemberName ?? `@${pullRequest.authorLogin}`} ·{' '}
                      {formatRelativeTime(pullRequest.updatedAt)} 업데이트
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-1.5 pl-6 sm:pl-0">
                  {pullRequest.isStale ? (
                    <span className="rounded-full bg-mt-danger px-2 py-0.5 text-xs leading-4 font-bold text-mt-white">
                      3일 넘게 멈춤
                    </span>
                  ) : null}
                  {pullRequest.isDraft ? (
                    <span className="rounded-full bg-mt-bg-soft px-2 py-0.5 text-xs leading-4 font-bold text-mt-text-secondary">
                      초안
                    </span>
                  ) : (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs leading-4 font-bold ${REVIEW_STATE_CLASS[pullRequest.reviewState]}`}
                    >
                      {REVIEW_STATE_LABEL[pullRequest.reviewState]}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-mt-border px-4 py-6 text-center text-sm text-mt-text-secondary">
            열린 PR이 없어요.
          </p>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <h3 className="text-sm leading-5 font-bold text-mt-text-primary">
          팀원별 기여{' '}
          <span className="font-medium text-mt-text-secondary">
            ({formatShortDate(progress.periodStart)} ~ {formatShortDate(progress.periodEnd)})
          </span>
        </h3>
        <div className="overflow-x-auto rounded-2xl border border-mt-border">
          <table className="w-full min-w-120 text-left text-sm leading-5">
            <thead className="bg-mt-bg-soft text-xs leading-4 font-bold text-mt-text-secondary">
              <tr>
                <th scope="col" className="px-4 py-2.5">
                  팀원
                </th>
                <th scope="col" className="px-4 py-2.5">
                  커밋
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  머지된 PR
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  리뷰
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mt-border">
              {progress.contributions.map((item) => (
                <tr key={item.memberId}>
                  <td className="px-4 py-3">
                    <p className="font-bold text-mt-text-primary">{item.name}</p>
                    <p className="text-xs leading-4 text-mt-text-secondary">
                      {item.githubLogin ? `@${item.githubLogin}` : 'GitHub 미연결'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-24 overflow-hidden rounded-full bg-mt-bg-soft">
                        <span
                          className="block h-full rounded-full bg-mt-primary"
                          style={{ width: `${(item.commits / maxCommits) * 100}%` }}
                        />
                      </span>
                      <span className="font-bold text-mt-text-primary">{item.commits}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-mt-text-primary">
                    {item.mergedPullRequests}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-mt-text-primary">
                    {item.reviews}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
