import type { GithubActivityLevel } from '@/types/github';
import { ACTIVITY_LEVEL_LABEL } from './githubFormat';

type GithubActivityBadgeProps = {
  level: GithubActivityLevel;
  /** overlay: 카드 이미지 위, surface: 흰 배경 위 */
  tone?: 'overlay' | 'surface';
  className?: string;
};

const DOT_CLASS: Record<GithubActivityLevel, string> = {
  ACTIVE: 'bg-mt-mint',
  MODERATE: 'bg-mt-logo-blue',
  DORMANT: 'bg-mt-text-secondary',
};

const TONE_CLASS = {
  overlay: 'border-mt-white/20 bg-mt-text-primary/40 text-mt-white backdrop-blur-md',
  surface: 'border-mt-border bg-mt-bg-soft text-mt-text-primary',
} as const;

export default function GithubActivityBadge({
  level,
  tone = 'surface',
  className = '',
}: GithubActivityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs leading-4 font-bold ${TONE_CLASS[tone]} ${className}`}
      data-cy="github-activity-badge"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${DOT_CLASS[level]} ${level === 'ACTIVE' ? 'animate-pulse motion-reduce:animate-none' : ''}`}
        aria-hidden
      />
      {ACTIVITY_LEVEL_LABEL[level]}
    </span>
  );
}
