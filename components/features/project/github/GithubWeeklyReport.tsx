'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ClipboardCopy, FileText } from 'lucide-react';
import IntroSectionHeading from '@/components/features/project/detail/project-intro/IntroSectionHeading';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import { useToastStore } from '@/stores/useToastStore';
import type { GithubWeeklyReport as WeeklyReport } from '@/types/github';
import { fetchProjectGithubWeeklyReport } from './githubApi';
import {
  buildWeeklyReportMarkdown,
  formatShortDate,
  getWeekEnd,
  getWeekStart,
  isFutureWeek,
  shiftWeek,
} from './githubFormat';

type GithubWeeklyReportProps = {
  projectId: string;
  projectTitle: string;
};

export default function GithubWeeklyReport({ projectId, projectTitle }: GithubWeeklyReportProps) {
  const showToast = useToastStore((state) => state.showToast);
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [result, setResult] = useState<{
    weekStart: string;
    report: WeeklyReport | null;
    errorMessage: string | null;
  } | null>(null);
  const isResultCurrent = result?.weekStart === weekStart;
  const report = isResultCurrent ? result.report : null;
  const errorMessage = isResultCurrent ? result.errorMessage : null;
  const isCurrentWeek = isFutureWeek(shiftWeek(weekStart, 1));

  useEffect(() => {
    let active = true;

    fetchProjectGithubWeeklyReport(projectId, weekStart)
      .then((nextReport) => {
        if (active) setResult({ weekStart, report: nextReport, errorMessage: null });
      })
      .catch((error: unknown) => {
        if (active) {
          setResult({
            weekStart,
            report: null,
            errorMessage:
              error instanceof Error ? error.message : '주간 리포트를 불러오지 못했습니다.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [projectId, weekStart]);

  const handleCopy = async () => {
    if (!report) return;

    try {
      await navigator.clipboard.writeText(buildWeeklyReportMarkdown(projectTitle, report));
      showToast({ tone: 'success', message: '주간 리포트를 마크다운으로 복사했어요.' });
    } catch {
      showToast({ message: '리포트를 복사하지 못했습니다. 다시 시도해 주세요.' });
    }
  };

  const summaryItems = report
    ? [
        { label: '커밋', value: report.summary.commits },
        { label: '머지된 PR', value: report.summary.mergedPullRequests },
        { label: '새 이슈', value: report.summary.openedIssues },
        { label: '닫힌 이슈', value: report.summary.closedIssues },
      ]
    : [];

  return (
    <section
      className="flex w-full min-w-0 flex-col gap-5 rounded-3xl border border-mt-border bg-mt-white p-4 shadow-sm sm:p-6"
      data-cy="github-weekly-report"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <IntroSectionHeading
          title="주간 리포트"
          icon={<FileText className="h-5 w-5" aria-hidden strokeWidth={1.8} />}
        />

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-xl border border-mt-border bg-mt-white">
            <button
              type="button"
              onClick={() => setWeekStart((current) => shiftWeek(current, -1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-l-xl text-mt-text-secondary transition-colors hover:bg-mt-bg-soft hover:text-mt-primary"
              aria-label="이전 주"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden strokeWidth={1.8} />
            </button>
            <span className="min-w-28 px-2 text-center text-sm leading-5 font-bold text-mt-text-primary">
              {formatShortDate(weekStart)} ~ {formatShortDate(getWeekEnd(weekStart))}
            </span>
            <button
              type="button"
              onClick={() => setWeekStart((current) => shiftWeek(current, 1))}
              disabled={isCurrentWeek}
              className="inline-flex h-9 w-9 items-center justify-center rounded-r-xl text-mt-text-secondary transition-colors hover:bg-mt-bg-soft hover:text-mt-primary disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="다음 주"
            >
              <ChevronRight className="h-4 w-4" aria-hidden strokeWidth={1.8} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => void handleCopy()}
            disabled={!report}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-mt-border bg-mt-badge-bg px-3 text-sm leading-5 font-bold text-mt-primary transition-colors hover:bg-mt-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ClipboardCopy className="h-4 w-4" aria-hidden strokeWidth={1.8} />
            마크다운 복사
          </button>
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-2xl border border-dashed border-mt-border px-4 py-6 text-center text-sm text-mt-text-secondary">
          {errorMessage}
        </p>
      ) : !report ? (
        <div className="space-y-3">
          <SkeletonBlock className="h-20 w-full" />
          <SkeletonBlock className="h-24 w-full" />
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-mt-border bg-mt-bg-soft px-4 py-3"
              >
                <dt className="text-xs leading-4 font-bold text-mt-text-secondary">{item.label}</dt>
                <dd className="mt-1 text-xl leading-7 font-extrabold text-mt-text-primary">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <div className="min-w-0">
              <h3 className="text-sm leading-5 font-bold text-mt-text-primary">머지된 PR</h3>
              <ul className="mt-2 space-y-1.5">
                {report.mergedPullRequests.length > 0 ? (
                  report.mergedPullRequests.map((pullRequest) => (
                    <li key={pullRequest.number} className="text-sm leading-5">
                      <a
                        href={pullRequest.url}
                        target="_blank"
                        rel="noreferrer"
                        className="break-words font-medium text-mt-text-primary hover:text-mt-primary hover:underline"
                      >
                        <span className="text-mt-text-secondary">#{pullRequest.number}</span>{' '}
                        {pullRequest.title}
                      </a>
                      <span className="text-xs text-mt-text-secondary">
                        {' '}
                        · {pullRequest.authorMemberName ?? `@${pullRequest.authorLogin}`}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-mt-text-secondary">이번 주 머지된 PR이 없어요.</li>
                )}
              </ul>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm leading-5 font-bold text-mt-text-primary">닫힌 이슈</h3>
              <ul className="mt-2 space-y-1.5">
                {report.closedIssues.length > 0 ? (
                  report.closedIssues.map((issue) => (
                    <li key={issue.number} className="text-sm leading-5">
                      <a
                        href={issue.url}
                        target="_blank"
                        rel="noreferrer"
                        className="break-words font-medium text-mt-text-primary hover:text-mt-primary hover:underline"
                      >
                        <span className="text-mt-text-secondary">#{issue.number}</span>{' '}
                        {issue.title}
                      </a>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-mt-text-secondary">이번 주 닫힌 이슈가 없어요.</li>
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
