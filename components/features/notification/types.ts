export type NotificationType =
  | 'PROJECT_APPLY'
  | 'PROJECT_MY_APPLY'
  | 'PROJECT_APPROVE'
  | 'PROJECT_REJECT'
  | 'PROJECT_END'
  | 'GITHUB_REPO_INVITED'
  | 'GITHUB_REVIEW_REQUESTED'
  | 'GITHUB_PR_MERGED'
  | 'PROJECT_PROPOSAL_RECEIVED';

export type NotificationCardVariant =
  | 'welcome'
  | 'applicant'
  | 'rejected'
  | 'submitted'
  | 'ended'
  | 'github'
  | 'proposal';

export interface NotificationCardProps {
  title: string;
  description: string;
  timestamp: string;
  variant: NotificationCardVariant;
  unread?: boolean;
  actionHref?: string;
  actionLabel?: string;
}

export interface NotificationItem extends NotificationCardProps {
  id: string;
  type: NotificationType;
  createdAt: string;
  applicationId?: number | null;
}
