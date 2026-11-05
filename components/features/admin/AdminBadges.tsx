import type {
  AdminApplicationStatus,
  AdminRecruitmentStatus,
  AuditAction,
  MemberRole,
  MemberStatus,
  ProjectVisibility,
} from '@/types/admin';

import StatusBadge from '@/components/shared/StatusBadge';
import {
  APPLICATION_STATUS_LABEL,
  AUDIT_ACTION_LABEL,
  MEMBER_ROLE_LABEL,
  MEMBER_STATUS_LABEL,
  PROJECT_VISIBILITY_LABEL,
  RECRUITMENT_STATUS_LABEL,
} from './constants';

const MEMBER_STATUS_BADGE = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  WITHDRAWN: 'withdrawn',
} as const;

const VISIBILITY_BADGE = {
  VISIBLE: 'active',
  HIDDEN: 'hidden',
  DELETED: 'deleted',
} as const;

const RECRUITMENT_BADGE = {
  RECRUITING: 'open',
  CLOSED: 'closed',
  SUSPENDED: 'suspended',
} as const;

const APPLICATION_BADGE = {
  PENDING: 'pending',
  ACCEPTED: 'active',
  REJECTED: 'deleted',
  CANCELLED: 'withdrawn',
} as const;

const AUDIT_ACTION_BADGE = {
  MEMBER_SUSPEND: 'deleted',
  MEMBER_UNSUSPEND: 'active',
  MEMBER_ROLE_CHANGE: 'admin',
  MEMBER_WITHDRAW: 'withdrawn',
  PROJECT_HIDE: 'hidden',
  PROJECT_RESTORE: 'active',
  PROJECT_DELETE: 'deleted',
  PROJECT_FORCE_CLOSE: 'pending',
  PROJECT_MEMBER_EXPEL: 'withdrawn',
} as const;

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  return (
    <StatusBadge
      status={MEMBER_STATUS_BADGE[status]}
      label={MEMBER_STATUS_LABEL[status]}
      size="sm"
    />
  );
}

export function MemberRoleBadge({ role }: { role: MemberRole }) {
  return role === 'ADMIN' ? (
    <StatusBadge status="admin" size="sm" />
  ) : (
    <span className="text-xs font-medium text-mt-text-secondary">{MEMBER_ROLE_LABEL[role]}</span>
  );
}

export function VisibilityBadge({ visibility }: { visibility: ProjectVisibility }) {
  return (
    <StatusBadge
      status={VISIBILITY_BADGE[visibility]}
      label={PROJECT_VISIBILITY_LABEL[visibility]}
      size="sm"
    />
  );
}

export function RecruitmentBadge({ status }: { status: AdminRecruitmentStatus }) {
  return (
    <StatusBadge
      status={RECRUITMENT_BADGE[status]}
      label={RECRUITMENT_STATUS_LABEL[status]}
      size="sm"
    />
  );
}

export function ApplicationStatusBadge({ status }: { status: AdminApplicationStatus }) {
  return (
    <StatusBadge
      status={APPLICATION_BADGE[status]}
      label={APPLICATION_STATUS_LABEL[status]}
      size="sm"
    />
  );
}

export function AuditActionBadge({ action }: { action: AuditAction }) {
  return (
    <StatusBadge status={AUDIT_ACTION_BADGE[action]} label={AUDIT_ACTION_LABEL[action]} size="sm" />
  );
}
