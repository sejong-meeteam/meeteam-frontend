import type { ReactNode } from 'react';

type StatusBadgeStatus =
  | 'open'
  | 'closed'
  | 'deadline'
  | 'suspended'
  | 'completed'
  | 'pending'
  | 'leader'
  | 'active'
  | 'withdrawn'
  | 'hidden'
  | 'deleted'
  | 'admin';
type StatusBadgeSize = 'xs' | 'sm' | 'md';

type StatusBadgeProps = {
  status: StatusBadgeStatus;
  label?: string;
  size?: StatusBadgeSize;
  icon?: ReactNode;
  className?: string;
};

const STATUS_CLASS: Record<StatusBadgeStatus, string> = {
  open: 'border-mt-mint bg-mt-mint text-mt-white',
  closed: 'border-mt-text-secondary bg-mt-text-secondary text-mt-white',
  deadline: 'border-mt-white/20 bg-mt-white/20 text-mt-white shadow-sm backdrop-blur-md',
  suspended: 'border-mt-danger bg-mt-danger text-mt-white',
  completed: 'border-transparent bg-mt-text-nav text-mt-white',
  pending: 'border-transparent bg-mt-border text-mt-primary',
  leader: 'border-transparent bg-mt-badge-bg text-mt-primary',
  active: 'border-mt-category-other-border bg-mt-category-other-bg text-mt-category-other-text',
  withdrawn: 'border-mt-border bg-mt-bg-soft text-mt-text-secondary',
  hidden:
    'border-mt-category-creative-border bg-mt-category-creative-bg text-mt-category-creative-text',
  deleted: 'border-mt-danger/30 bg-mt-danger-soft text-mt-danger',
  admin: 'border-mt-category-club-border bg-mt-category-club-bg text-mt-category-club-text',
};

const DEFAULT_LABEL: Record<StatusBadgeStatus, string> = {
  open: '모집중',
  closed: '마감',
  deadline: '마감',
  suspended: '모집 중단',
  completed: '모집 완료',
  pending: '대기',
  leader: '리더',
  active: '활성',
  withdrawn: '탈퇴',
  hidden: '숨김',
  deleted: '삭제됨',
  admin: '관리자',
};

const SIZE_CLASS: Record<StatusBadgeSize, string> = {
  xs: 'px-1.5 py-0.5 text-[10px] leading-4',
  sm: 'px-2 py-0.5 text-xs leading-4',
  md: 'px-3 py-1.5 text-sm leading-5',
};

export default function StatusBadge({
  status,
  label = DEFAULT_LABEL[status],
  size = 'xs',
  icon,
  className = '',
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-bold ${STATUS_CLASS[status]} ${SIZE_CLASS[size]} ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}
