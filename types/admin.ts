import type { MemberRole } from './auth';

export type { MemberRole };

export type MemberStatus = 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';
export type ProjectVisibility = 'VISIBLE' | 'HIDDEN' | 'DELETED';
export type AdminRecruitmentStatus = 'RECRUITING' | 'CLOSED' | 'SUSPENDED';
export type AdminProjectCategory = 'CAPSTONE' | 'CREATIVE_SEMESTER' | 'CLUB' | 'ETC';
export type AdminProjectPlatform = 'WEB' | 'IOS' | 'ANDROID';
export type AdminApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export type AdminPage<T> = {
  content: T[];
  number: number;
  size: number;
  numberOfElements: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type AdminMemberSummary = {
  memberId: number;
  name: string;
  studentId: string | null;
  email: string;
  profileImageUrl: string | null;
  representativePosition: string | null;
  jobFieldCode: string | null;
  jobFieldName: string | null;
  role: MemberRole;
  status: MemberStatus;
  suspendedUntil: string | null;
  projectCount: number;
  createdAt: string;
  lastLoginAt: string | null;
};

export type AdminMemberProject = {
  projectId: number;
  projectName: string;
  category: AdminProjectCategory;
  isLeader: boolean;
  recruitmentStatus: AdminRecruitmentStatus;
  visibility: ProjectVisibility;
  createdAt: string;
};

export type AdminMemberApplication = {
  applicationId: number;
  projectId: number;
  projectName: string;
  jobPositionName: string;
  status: AdminApplicationStatus;
  appliedAt: string;
};

export type AdminMemberDetail = AdminMemberSummary & {
  birthDate: string | null;
  gender: 'MALE' | 'FEMALE' | null;
  githubUrl: string | null;
  blogUrl: string | null;
  introduce: string | null;
  jobPositions: string[];
  skills: string[];
  suspendReason: string | null;
  projects: AdminMemberProject[];
  applications: AdminMemberApplication[];
};

export type AdminProjectSummary = {
  projectId: number;
  name: string;
  imageUrl: string | null;
  leaderId: number;
  leaderName: string;
  category: AdminProjectCategory;
  platform: AdminProjectPlatform;
  currentMembers: number;
  targetMembers: number;
  recruitmentStatus: AdminRecruitmentStatus;
  visibility: ProjectVisibility;
  pendingApplicationCount: number;
  deadline: string | null;
  createdAt: string;
};

export type AdminProjectMember = {
  memberId: number;
  name: string;
  profileImageUrl: string | null;
  jobPositionName: string | null;
  isLeader: boolean;
};

export type AdminProjectRecruitment = {
  jobFieldName: string;
  jobPositionName: string;
  recruitmentCount: number;
  currentCount: number;
  isClosed: boolean;
  techStacks: string[];
};

export type AdminProjectDetail = AdminProjectSummary & {
  description: string;
  githubUrl: string | null;
  communicationUrl: string | null;
  members: AdminProjectMember[];
  recruitments: AdminProjectRecruitment[];
  applicationStats: Record<AdminApplicationStatus, number>;
};

export type AuditAction =
  | 'MEMBER_SUSPEND'
  | 'MEMBER_UNSUSPEND'
  | 'MEMBER_ROLE_CHANGE'
  | 'MEMBER_WITHDRAW'
  | 'PROJECT_HIDE'
  | 'PROJECT_RESTORE'
  | 'PROJECT_DELETE'
  | 'PROJECT_FORCE_CLOSE'
  | 'PROJECT_MEMBER_EXPEL';

export type AuditTargetType = 'MEMBER' | 'PROJECT';

export type AuditLog = {
  id: number;
  adminId: number;
  adminName: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: number;
  targetName: string;
  reason: string;
  metadata: Record<string, string | number | null> | null;
  createdAt: string;
};

export type AdminDashboard = {
  stats: {
    totalMembers: number;
    newMembersToday: number;
    suspendedMembers: number;
    totalProjects: number;
    recruitingProjects: number;
    hiddenProjects: number;
    pendingApplications: number;
  };
  recentMembers: AdminMemberSummary[];
  recentProjects: AdminProjectSummary[];
  recentAuditLogs: AuditLog[];
};
