import type { ApiEnvelope } from '@/types/auth';
import type { GithubActivityLevel, GithubActivitySummary } from '@/types/github';
import type { MeetingMode, ProjectCollaboration } from '@/types/project';

import { API_BASE_URL, apiFetch } from '@/components/features/auth/apiClient';
import { extractApiData } from '@/components/features/auth/signupTransform';
import { parseProjectCollaboration } from '@/components/features/project/collaboration';
import {
  findProjectCategoryByLabel,
  type ProjectCategoryLabel,
} from '@/components/features/project/constants';
import { getJobFieldLabel } from '@/constants/jobField';

export type HomeProjectCategory = '전체' | ProjectCategoryLabel;

export type HomeProjectCard = {
  id: number;
  title: string;
  imageUrl: string;
  category: string;
  deadline: string;
  currentMembers: number;
  maxMembers: number;
  leader: {
    name: string;
    avatar: string;
  };
  tags: string[];
  githubActivityLevel: GithubActivityLevel | null;
  meetingMode: MeetingMode | null;
  weeklyHours: number | null;
  recruitInfo: Array<{
    id: string | number;
    role: string;
    subRoles: string[];
    status: string;
    current: number;
    max: number;
  }>;
};

export type HomeMemberCard = {
  userId: number;
  name: string;
  department?: string | null;
  role: string;
  experience: string;
  skills: string[];
  imageUrl: string;
};

export type HomePagedResult<T> = {
  items: T[];
  page: number;
  hasMore: boolean;
};

type BackendPage<T> = {
  content: T[];
  last: boolean;
  number: number;
  size: number;
  empty: boolean;
};

type BackendProjectCardResponse = {
  projectId: number;
  projectName: string;
  categoryName: string;
  categoryCode: string;
  platformName: string;
  imageUrl: string | null;
  endDate: string | null;
  creatorName: string;
  creatorImageUrl: string | null;
  currentCount: number;
  recruitmentCount: number;
  recruitments: Array<{
    jobFieldName: string;
    jobPositionName: string;
    currentCount: number;
    recruitmentCount: number;
    isClosed?: boolean;
    closed?: boolean;
  }>;
  githubActivity?: GithubActivitySummary | null;
  meetingMode?: ProjectCollaboration['meetingMode'];
  weeklyHours?: ProjectCollaboration['weeklyHours'];
};

type BackendMemberCardResponse = {
  memberId: number;
  profileImageUrl: string | null;
  jobFieldName: string | null;
  name: string;
  department?: string | null;
  projectCount: number;
  projectExperienceCount?: number;
  techStacks: Array<{
    id: number;
    name: string;
    displayOrder: number;
  }>;
};

type BackendMemberTechStack = BackendMemberCardResponse['techStacks'][number];

async function readPublicEnvelope<T>(response: Response, fallbackMessage: string) {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? fallbackMessage);
  }

  if (!payload) {
    throw new Error('응답 형식을 해석할 수 없습니다.');
  }

  return extractApiData(payload);
}

function mapHomeProject(project: BackendProjectCardResponse): HomeProjectCard {
  const { meetingMode, weeklyHours } = parseProjectCollaboration(project);

  return {
    id: project.projectId,
    title: project.projectName,
    imageUrl: project.imageUrl ?? '',
    category: project.categoryName,
    deadline: project.endDate ?? '',
    currentMembers: project.currentCount,
    maxMembers: project.recruitmentCount,
    leader: {
      name: project.creatorName,
      avatar: project.creatorImageUrl ?? '',
    },
    tags: [project.platformName].filter(Boolean),
    githubActivityLevel: project.githubActivity?.activityLevel ?? null,
    meetingMode,
    weeklyHours,
    recruitInfo: project.recruitments.map((recruitment, index) => ({
      id: `${project.projectId}-${index + 1}`,
      role: recruitment.jobFieldName,
      subRoles: [recruitment.jobPositionName],
      status: (recruitment.isClosed ?? recruitment.closed) ? 'closed' : 'open',
      current: recruitment.currentCount,
      max: recruitment.recruitmentCount,
    })),
  };
}

function mapHomeMember(member: BackendMemberCardResponse): HomeMemberCard {
  return {
    userId: member.memberId,
    name: member.name,
    department: member.department ?? null,
    role: member.jobFieldName ? getJobFieldLabel(member.jobFieldName) : '기타',
    experience: `참여 프로젝트 ${member.projectCount ?? member.projectExperienceCount ?? 0}개`,
    skills: mapTopTechStackNames(member.techStacks),
    imageUrl: member.profileImageUrl ?? '',
  };
}

function mapTopTechStackNames(techStacks: BackendMemberTechStack[]) {
  return [...techStacks]
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .slice(0, 3)
    .map((techStack) => techStack.name);
}

export async function fetchHomeProjectsPage(
  size = 4,
  category: HomeProjectCategory = '전체',
  page = 0,
): Promise<HomePagedResult<HomeProjectCard>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: 'createdAt,desc',
  });
  const projectCategory = findProjectCategoryByLabel(category)?.code;

  if (projectCategory) {
    params.set('projectCategory', projectCategory);
  }

  const response = await apiFetch(`${API_BASE_URL}/api/v1/main/projects?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  });

  const result = await readPublicEnvelope<BackendPage<BackendProjectCardResponse>>(
    response,
    '메인 프로젝트 목록을 불러오지 못했습니다.',
  );

  return {
    items: result.content.map(mapHomeProject),
    page: result.number,
    hasMore: !result.last,
  };
}

export async function fetchHomeProjects(size = 4, category: HomeProjectCategory = '전체') {
  const result = await fetchHomeProjectsPage(size, category);

  return result.items;
}

export async function fetchHomeMembersPage(
  size = 5,
  page = 0,
): Promise<HomePagedResult<HomeMemberCard>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: 'createdAt,desc',
  });

  const response = await apiFetch(`${API_BASE_URL}/api/v1/main/members?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  });

  const result = await readPublicEnvelope<BackendPage<BackendMemberCardResponse>>(
    response,
    '메인 팀원 목록을 불러오지 못했습니다.',
  );

  return {
    items: result.content.map(mapHomeMember),
    page: result.number,
    hasMore: !result.last,
  };
}

export async function fetchHomeMembers(size = 5) {
  const result = await fetchHomeMembersPage(size);

  return result.items;
}
