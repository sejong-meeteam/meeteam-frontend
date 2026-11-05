import { INITIAL_MEMBERS, INITIAL_PROJECTS, type MockMember } from '@/mocks/fixtures';
import type { ProjectRecord, AppliedProject } from './projectContract';

export type MockApplication = AppliedProject & { applicantId: number; motivation: string };
const APPLICATIONS_KEY = 'meeteam-week6-applications';
const LIKES_KEY = 'meeteam-week6-likes';

export function getApplications(): MockApplication[] {
  try {
    return JSON.parse(localStorage.getItem(APPLICATIONS_KEY) ?? '[]') as MockApplication[];
  } catch {
    return [];
  }
}
export function saveApplication(application: MockApplication) {
  localStorage.setItem(
    APPLICATIONS_KEY,
    JSON.stringify([
      ...getApplications().filter((item) => item.applicationId !== application.applicationId),
      application,
    ]),
  );
}
export function getLikes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LIKES_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}
export function toggleLike(memberId: number, projectId: number) {
  const key = `${memberId}:${projectId}`;
  const likes = getLikes();
  const next = likes.includes(key) ? likes.filter((item) => item !== key) : [...likes, key];
  localStorage.setItem(LIKES_KEY, JSON.stringify(next));
  return {
    liked: next.includes(key),
    likeCount: next.filter((item) => item.endsWith(`:${projectId}`)).length,
  };
}

const MEMBERS_KEY = 'meeteam-week4-members';
const SESSION_KEY = 'meeteam-week4-session';
const PROJECTS_KEY = 'meeteam-week5-projects';

export function getProjects(): ProjectRecord[] {
  try {
    const stored = localStorage.getItem(PROJECTS_KEY);
    if (!stored) return INITIAL_PROJECTS;
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as ProjectRecord[]) : INITIAL_PROJECTS;
  } catch {
    return INITIAL_PROJECTS;
  }
}

export function saveProject(project: ProjectRecord) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify([project, ...getProjects()]));
}

export function getMembers(): MockMember[] {
  try {
    const stored = localStorage.getItem(MEMBERS_KEY);
    if (!stored) return INITIAL_MEMBERS;
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? withInitialMembers(parsed as MockMember[]) : INITIAL_MEMBERS;
  } catch {
    return INITIAL_MEMBERS;
  }
}

// 이전 데모 데이터에도 관리자 계정과 회원 상태 필드가 포함되도록 기본 회원 정보를 보강합니다.
function withInitialMembers(members: MockMember[]) {
  const initialById = new Map(INITIAL_MEMBERS.map((member) => [member.memberId, member]));
  const storedIds = new Set(members.map((member) => member.memberId));
  return [
    ...members.map((member) => ({ ...initialById.get(member.memberId), ...member })),
    ...INITIAL_MEMBERS.filter((member) => !storedIds.has(member.memberId)),
  ];
}

export function getMemberStatus(member: MockMember) {
  if (
    member.status === 'SUSPENDED' &&
    member.suspendedUntil &&
    new Date(member.suspendedUntil).getTime() <= Date.now()
  )
    return 'ACTIVE';
  return member.status ?? 'ACTIVE';
}

export function updateMember(member: MockMember) {
  localStorage.setItem(
    MEMBERS_KEY,
    JSON.stringify(getMembers().map((item) => (item.memberId === member.memberId ? member : item))),
  );
}

export function saveMember(member: MockMember) {
  const members = getMembers().filter((item) => item.memberId !== member.memberId);
  localStorage.setItem(MEMBERS_KEY, JSON.stringify([...members, member]));
}

export function getSessionMember() {
  const memberId = Number(localStorage.getItem(SESSION_KEY));
  const member = getMembers().find((item) => item.memberId === memberId);
  return member && getMemberStatus(member) === 'ACTIVE' ? member : null;
}

export function setSession(memberId: number) {
  localStorage.setItem(SESSION_KEY, String(memberId));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
