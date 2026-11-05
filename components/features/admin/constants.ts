import type {
  AdminApplicationStatus,
  AdminProjectCategory,
  AdminProjectPlatform,
  AdminRecruitmentStatus,
  AuditAction,
  AuditTargetType,
  MemberRole,
  MemberStatus,
  ProjectVisibility,
} from '@/types/admin';
import type { BaseSelectOption } from '@/components/shared/BaseSelect';

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  ACTIVE: '활성',
  SUSPENDED: '정지',
  WITHDRAWN: '탈퇴',
};

export const MEMBER_ROLE_LABEL: Record<MemberRole, string> = {
  USER: '일반 회원',
  ADMIN: '관리자',
};

export const PROJECT_VISIBILITY_LABEL: Record<ProjectVisibility, string> = {
  VISIBLE: '노출 중',
  HIDDEN: '숨김',
  DELETED: '삭제됨',
};

export const RECRUITMENT_STATUS_LABEL: Record<AdminRecruitmentStatus, string> = {
  RECRUITING: '모집중',
  CLOSED: '마감',
  SUSPENDED: '모집 중단',
};

export const PROJECT_CATEGORY_LABEL: Record<AdminProjectCategory, string> = {
  CAPSTONE: '캡스톤',
  CREATIVE_SEMESTER: '창의학기제',
  CLUB: '동아리',
  ETC: '기타',
};

export const PROJECT_PLATFORM_LABEL: Record<AdminProjectPlatform, string> = {
  WEB: '웹',
  IOS: 'iOS',
  ANDROID: '안드로이드',
};

export const APPLICATION_STATUS_LABEL: Record<AdminApplicationStatus, string> = {
  PENDING: '대기',
  ACCEPTED: '승인',
  REJECTED: '거절',
  CANCELLED: '취소',
};

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  MEMBER_SUSPEND: '회원 정지',
  MEMBER_UNSUSPEND: '정지 해제',
  MEMBER_ROLE_CHANGE: '권한 변경',
  MEMBER_WITHDRAW: '강제 탈퇴',
  PROJECT_HIDE: '프로젝트 숨김',
  PROJECT_RESTORE: '프로젝트 복구',
  PROJECT_DELETE: '프로젝트 삭제',
  PROJECT_FORCE_CLOSE: '모집 강제 마감',
  PROJECT_MEMBER_EXPEL: '팀원 강제 제외',
};

export const AUDIT_TARGET_LABEL: Record<AuditTargetType, string> = {
  MEMBER: '회원',
  PROJECT: '프로젝트',
};

function toOptions<T extends string>(labels: Record<T, string>, allLabel: string) {
  return [
    { value: '', label: allLabel },
    ...(Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label })),
  ] satisfies BaseSelectOption[];
}

export const MEMBER_STATUS_OPTIONS = toOptions(MEMBER_STATUS_LABEL, '전체 상태');
export const MEMBER_ROLE_OPTIONS = toOptions(MEMBER_ROLE_LABEL, '전체 권한');
export const PROJECT_CATEGORY_OPTIONS = toOptions(PROJECT_CATEGORY_LABEL, '전체 카테고리');
export const RECRUITMENT_STATUS_OPTIONS = toOptions(RECRUITMENT_STATUS_LABEL, '전체 모집 상태');
export const PROJECT_VISIBILITY_OPTIONS = toOptions(PROJECT_VISIBILITY_LABEL, '전체 노출 상태');
export const AUDIT_ACTION_OPTIONS = toOptions(AUDIT_ACTION_LABEL, '전체 조치');
export const AUDIT_TARGET_OPTIONS = toOptions(AUDIT_TARGET_LABEL, '전체 대상');

export const MEMBER_SORT_OPTIONS: BaseSelectOption[] = [
  { value: 'createdAt,desc', label: '최근 가입순' },
  { value: 'lastLoginAt,desc', label: '최근 접속순' },
  { value: 'projectCount,desc', label: '참여 프로젝트순' },
  { value: 'name,asc', label: '이름순' },
];

export const PROJECT_SORT_OPTIONS: BaseSelectOption[] = [
  { value: 'createdAt,desc', label: '최근 생성순' },
  { value: 'name,asc', label: '이름순' },
  { value: 'pendingApplicationCount,desc', label: '대기 지원 많은순' },
];

export const SUSPEND_PERIOD_OPTIONS = [
  { days: 3, label: '3일' },
  { days: 7, label: '7일' },
  { days: 30, label: '30일' },
  { days: null, label: '영구' },
] as const;
