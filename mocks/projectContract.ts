export const PROJECT_CATEGORIES = [
  { code: 'CAPSTONE', label: '캡스톤' },
  { code: 'CREATIVE_SEMESTER', label: '창의학기제' },
  { code: 'CLUB', label: '동아리' },
  { code: 'STUDY', label: '스터디' },
  { code: 'CONTEST', label: '공모전' },
  { code: 'ETC', label: '기타' },
] as const;

export const MEETING_MODES = ['ONLINE', 'OFFLINE', 'HYBRID'] as const;

export const PROJECT_CATEGORY_CODES = PROJECT_CATEGORIES.map((category) => category.code);

export const PROJECT_PLATFORMS = [
  { code: 'WEB', label: '웹' },
  { code: 'IOS', label: 'iOS' },
  { code: 'ANDROID', label: '안드로이드' },
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]['code'];
export type ProjectPlatform = (typeof PROJECT_PLATFORMS)[number]['code'];
export type MeetingMode = (typeof MEETING_MODES)[number];

export type ProjectCollaboration = {
  meetingMode?: MeetingMode | null;
  weeklyHours?: number | null;
  meetingNote?: string | null;
};

export type ProjectRecruitment = {
  jobFieldCode: string;
  jobPositionId: number;
  count: number;
  techStackIds: number[];
  jobFieldName?: string;
  jobPositionName?: string;
  techStackNames?: string[];
  currentCount?: number;
  closed?: boolean;
};

export type ProjectCreateRequest = {
  name: string;
  category: ProjectCategory;
  platform: ProjectPlatform;
  description: string;
  githubUrl: string;
  communicationUrl: string;
  leaderPositionId: number;
  recruitments: ProjectRecruitment[];
  deadline: string | null;
  closeWhenFull: boolean;
} & ProjectCollaboration;

export type ProjectRecord = ProjectCreateRequest & {
  id: number;
  leaderId: number;
  leaderName: string;
  imageUrl: string | null;
  createdAt: string;
  currentMembers: number;
  memberIds?: number[];
  isLeader?: boolean;
  isLiked?: boolean;
  likeCount?: number;
  recruitmentStatus?: 'RECRUITING' | 'CLOSED' | 'SUSPENDED';
  visibility?: 'VISIBLE' | 'HIDDEN' | 'DELETED';
};

export function getProjectCategoryName(category: ProjectCategory) {
  return PROJECT_CATEGORIES.find((item) => item.code === category)?.label ?? '기타';
}

export function toProjectCollaboration(project: ProjectCollaboration) {
  return {
    meetingMode: project.meetingMode ?? null,
    weeklyHours: project.weeklyHours ?? null,
    meetingNote: project.meetingNote ?? null,
  };
}

export function matchesMeetingMode(project: ProjectCollaboration, requested: string) {
  if (!requested) return true;
  if (requested === 'ONLINE')
    return project.meetingMode === 'ONLINE' || project.meetingMode === 'HYBRID';
  return project.meetingMode === requested;
}

export function isProjectVisible(project: ProjectRecord) {
  return (project.visibility ?? 'VISIBLE') === 'VISIBLE';
}
export function todayLocalDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function isRecruitmentOpen(item: ProjectRecruitment) {
  return !item.closed && (item.currentCount ?? 0) < item.count;
}
export function isProjectOpen(project: ProjectRecord) {
  return (
    (!project.recruitmentStatus || project.recruitmentStatus === 'RECRUITING') &&
    (!project.deadline || project.deadline.slice(0, 10) >= todayLocalDate()) &&
    project.recruitments.some(isRecruitmentOpen)
  );
}
export type AppliedProject = {
  applicationId: number;
  projectId: number;
  projectName: string;
  projectImageUrl: string | null;
  jobPositionId: number;
  jobPositionName: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  statusDisplayName: string;
  appliedAt: string;
};
