export type GithubActivityLevel = 'ACTIVE' | 'MODERATE' | 'DORMANT';

export type GithubActivitySummary = {
  activityLevel: GithubActivityLevel;
  lastPushedAt: string | null;
};

export type GithubAccount = {
  login: string;
  avatarUrl: string;
  profileUrl: string;
  connectedAt: string;
};

export type GithubRepository = {
  id: number;
  fullName: string;
  htmlUrl: string;
  description: string;
  isPrivate: boolean;
  defaultBranch: string;
  stars: number;
  forks: number;
};

export type GithubLanguageShare = {
  name: string;
  percentage: number;
};

export type GithubContributor = {
  login: string;
  avatarUrl: string;
  commits: number;
  memberId: number | null;
  memberName: string | null;
};

export type ProjectGithubActivity = GithubActivitySummary & {
  repository: GithubRepository;
  /** 오래된 주 → 최근 주 순서의 주간 커밋 수 */
  weeklyCommits: number[];
  openPullRequestCount: number;
  openIssueCount: number;
  languages: GithubLanguageShare[];
  contributors: GithubContributor[];
  syncedAt: string;
};

export type GithubReviewState = 'REVIEW_REQUIRED' | 'APPROVED' | 'CHANGES_REQUESTED';

export type GithubPullRequest = {
  number: number;
  title: string;
  url: string;
  authorLogin: string;
  authorMemberName: string | null;
  isDraft: boolean;
  reviewState: GithubReviewState;
  createdAt: string;
  updatedAt: string;
  isStale: boolean;
};

export type GithubMemberContribution = {
  memberId: number;
  name: string;
  githubLogin: string | null;
  commits: number;
  mergedPullRequests: number;
  reviews: number;
};

export type ProjectGithubProgress = {
  periodStart: string;
  periodEnd: string;
  pullRequests: GithubPullRequest[];
  contributions: GithubMemberContribution[];
};

export type GithubWeeklyReport = {
  weekStart: string;
  weekEnd: string;
  summary: {
    commits: number;
    mergedPullRequests: number;
    openedIssues: number;
    closedIssues: number;
  };
  mergedPullRequests: Array<{
    number: number;
    title: string;
    url: string;
    authorLogin: string;
    authorMemberName: string | null;
    mergedAt: string;
  }>;
  closedIssues: Array<{ number: number; title: string; url: string; closedAt: string }>;
  contributions: GithubMemberContribution[];
};

export type GithubAccessStatus =
  | 'ACTIVE'
  | 'INVITED'
  | 'NOT_INVITED'
  | 'NO_GITHUB_ACCOUNT'
  | 'FAILED';

export type GithubCollaborator = {
  memberId: number;
  name: string;
  profileImageUrl: string;
  isLeader: boolean;
  githubLogin: string | null;
  accessStatus: GithubAccessStatus;
  invitedAt: string | null;
};

export type ProjectGithubSettings = {
  autoInviteOnApproval: boolean;
  autoRevokeOnRemoval: boolean;
};

export type ProjectGithubConnection = {
  isAppInstalled: boolean;
  repository: GithubRepository | null;
  settings: ProjectGithubSettings;
};
