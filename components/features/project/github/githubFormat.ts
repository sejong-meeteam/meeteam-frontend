import type {
  GithubAccessStatus,
  GithubActivityLevel,
  GithubReviewState,
  GithubWeeklyReport,
} from '@/types/github';

export const ACTIVITY_LEVEL_LABEL: Record<GithubActivityLevel, string> = {
  ACTIVE: '활발히 개발 중',
  MODERATE: '개발 진행 중',
  DORMANT: '휴면',
};

export const REVIEW_STATE_LABEL: Record<GithubReviewState, string> = {
  REVIEW_REQUIRED: '리뷰 대기',
  APPROVED: '승인됨',
  CHANGES_REQUESTED: '변경 요청',
};

export const ACCESS_STATUS_LABEL: Record<GithubAccessStatus, string> = {
  ACTIVE: '접근 중',
  INVITED: '초대 수락 대기',
  NOT_INVITED: '미초대',
  NO_GITHUB_ACCOUNT: 'GitHub 미연결',
  FAILED: '초대 실패',
};

export function formatRelativeTime(value: string | null, now = new Date()) {
  if (!value) {
    return '기록 없음';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60_000);

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffMinutes < 60 * 24) return `${Math.floor(diffMinutes / 60)}시간 전`;

  const diffDays = Math.floor(diffMinutes / (60 * 24));

  if (diffDays < 30) return `${diffDays}일 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;

  return `${Math.floor(diffDays / 365)}년 전`;
}

function toLocalDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** 해당 날짜가 속한 주의 월요일 (YYYY-MM-DD) */
export function getWeekStart(date = new Date()) {
  const day = date.getDay();
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - ((day + 6) % 7));

  return toLocalDate(monday);
}

export function shiftWeek(weekStart: string, offset: number) {
  const [year, month, day] = weekStart.split('-').map(Number);
  const date = new Date(year, month - 1, day + offset * 7);

  return toLocalDate(date);
}

/** 주의 마지막 날(일요일) */
export function getWeekEnd(weekStart: string) {
  const [year, month, day] = weekStart.split('-').map(Number);

  return toLocalDate(new Date(year, month - 1, day + 6));
}

export function formatShortDate(value: string) {
  const [, month, day] = value.slice(0, 10).split('-').map(Number);

  return month && day ? `${month}/${day}` : value;
}

export function isFutureWeek(weekStart: string, now = new Date()) {
  return weekStart > getWeekStart(now);
}

/** 교수님 보고·회의록에 그대로 붙여 넣을 수 있는 마크다운 */
export function buildWeeklyReportMarkdown(projectTitle: string, report: GithubWeeklyReport) {
  const { summary } = report;
  const lines = [
    `# ${projectTitle} 주간 개발 리포트 (${report.weekStart} ~ ${report.weekEnd})`,
    '',
    '## 요약',
    `- 커밋 ${summary.commits}건`,
    `- 머지된 PR ${summary.mergedPullRequests}건`,
    `- 새 이슈 ${summary.openedIssues}건 / 닫힌 이슈 ${summary.closedIssues}건`,
    '',
    '## 머지된 PR',
    ...(report.mergedPullRequests.length > 0
      ? report.mergedPullRequests.map(
          (pr) =>
            `- #${pr.number} ${pr.title} (${pr.authorMemberName ?? `@${pr.authorLogin}`}, ${formatShortDate(pr.mergedAt)})`,
        )
      : ['- 없음']),
    '',
    '## 닫힌 이슈',
    ...(report.closedIssues.length > 0
      ? report.closedIssues.map((issue) => `- #${issue.number} ${issue.title}`)
      : ['- 없음']),
    '',
    '## 팀원별 기여',
    '| 팀원 | 커밋 | 머지된 PR | 리뷰 |',
    '| --- | ---: | ---: | ---: |',
    ...report.contributions.map(
      (item) => `| ${item.name} | ${item.commits} | ${item.mergedPullRequests} | ${item.reviews} |`,
    ),
  ];

  return lines.join('\n');
}
