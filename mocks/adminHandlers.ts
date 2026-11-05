import { delay, http, HttpResponse } from 'msw';
import type { z } from 'zod';
import type {
  AdminMemberDetail,
  AdminMemberSummary,
  AdminProjectDetail,
  AdminProjectSummary,
  AdminRecruitmentStatus,
  AuditAction,
  MemberStatus,
  ProjectVisibility,
} from '@/types/admin';
import {
  ADMIN_PAGE_SIZE,
  changeRoleRequestSchema,
  changeVisibilityRequestSchema,
  reasonRequestSchema,
  suspendMemberRequestSchema,
} from '@/components/features/admin/schema';
import { JOB_OPTIONS, type MockMember } from './fixtures';
import { isProjectOpen, type ProjectRecord } from './projectContract';
import { removeMember, replaceMockProject } from './projectManagementHandlers';
import { toProjectRecruitments } from './responseMappers';
import {
  getApplications,
  getMemberStatus,
  getMembers,
  getProjects,
  getSessionMember,
  saveApplication,
  updateMember,
} from './storage';
import { appendAuditLog, getAuditLogs } from './adminStorage';

const DAY_MS = 24 * 60 * 60 * 1000;
const FALLBACK_CREATED_AT = '2026-03-01T00:00:00.000Z';
const positions = JOB_OPTIONS.fields.flatMap((field) => field.positions);
const techStacks = JOB_OPTIONS.fields.flatMap((field) => field.techStacks);

function success<T>(result: T) {
  return HttpResponse.json({ code: 'COMMON200', message: '요청에 성공했습니다.', result });
}

function failure(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message, result: null }, { status });
}

function requireAdmin(): MockMember | Response {
  const member = getSessionMember();
  if (!member) return failure(401, 'UNAUTHORIZED', '로그인이 필요합니다.');
  if (member.role !== 'ADMIN') return failure(403, 'ADMIN403', '관리자 권한이 필요합니다.');
  return member;
}

async function parseBody<T extends z.ZodType>(request: Request, schema: T) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (parsed.success) return parsed.data as z.infer<T>;
  return failure(
    400,
    'ADMIN_INVALID_REQUEST',
    parsed.error.issues[0]?.message ?? '요청 내용을 확인해 주세요.',
  );
}

function pageOf<T>(items: T[], params: URLSearchParams) {
  const page = Math.max(0, Number(params.get('page')) || 0);
  const size = Math.min(50, Math.max(1, Number(params.get('size')) || ADMIN_PAGE_SIZE));
  const content = items.slice(page * size, (page + 1) * size);
  return {
    content,
    number: page,
    size,
    numberOfElements: content.length,
    totalElements: items.length,
    first: page === 0,
    last: (page + 1) * size >= items.length,
    empty: !content.length,
  };
}

function maskStudentId(studentId: string | undefined) {
  return studentId
    ? `${studentId.slice(0, 4)}${'*'.repeat(Math.max(0, studentId.length - 4))}`
    : null;
}

function fieldOf(member: MockMember) {
  return JOB_OPTIONS.fields.find((field) =>
    field.positions.some((position) => position.id === member.jobPositionIds[0]),
  );
}

function visibilityOf(project: ProjectRecord): ProjectVisibility {
  return project.visibility ?? 'VISIBLE';
}

function recruitmentStatusOf(project: ProjectRecord): AdminRecruitmentStatus {
  if (project.recruitmentStatus === 'SUSPENDED') return 'SUSPENDED';
  return isProjectOpen(project) ? 'RECRUITING' : 'CLOSED';
}

function projectsOf(memberId: number) {
  return getProjects().filter(
    (project) =>
      visibilityOf(project) !== 'DELETED' &&
      (project.leaderId === memberId || project.memberIds?.includes(memberId)),
  );
}

function toMemberSummary(member: MockMember, maskId = true): AdminMemberSummary {
  const field = fieldOf(member);
  const status = getMemberStatus(member);
  return {
    memberId: member.memberId,
    name: member.name,
    studentId: maskId ? maskStudentId(member.studentId) : (member.studentId ?? null),
    email: member.email,
    profileImageUrl: member.profileImageUrl,
    representativePosition:
      positions.find((position) => position.id === member.jobPositionIds[0])?.name ?? null,
    jobFieldCode: field?.code ?? null,
    jobFieldName: field?.name ?? null,
    role: member.role ?? 'USER',
    status,
    suspendedUntil: status === 'SUSPENDED' ? (member.suspendedUntil ?? null) : null,
    projectCount: projectsOf(member.memberId).length,
    createdAt: member.createdAt ?? FALLBACK_CREATED_AT,
    lastLoginAt: member.lastLoginAt ?? null,
  };
}

function toMemberDetail(member: MockMember): AdminMemberDetail {
  const summary = toMemberSummary(member, false);
  const projects = getProjects();
  return {
    ...summary,
    birthDate: member.birthDate || null,
    gender: member.gender ?? null,
    githubUrl: member.githubUrl || null,
    blogUrl: member.blogUrl || null,
    introduce: member.introduce || null,
    jobPositions: member.jobPositionIds
      .map((id) => positions.find((position) => position.id === id)?.name)
      .filter((name): name is string => Boolean(name)),
    skills: member.techStackIds
      .map((id) => techStacks.find((stack) => stack.id === id)?.name)
      .filter((name): name is string => Boolean(name)),
    suspendReason: summary.status === 'SUSPENDED' ? (member.suspendReason ?? null) : null,
    projects: projectsOf(member.memberId).map((project) => ({
      projectId: project.id,
      projectName: project.name,
      category: project.category,
      isLeader: project.leaderId === member.memberId,
      recruitmentStatus: recruitmentStatusOf(project),
      visibility: visibilityOf(project),
      createdAt: project.createdAt,
    })),
    applications: getApplications()
      .filter((application) => application.applicantId === member.memberId)
      .map((application) => ({
        applicationId: application.applicationId,
        projectId: application.projectId,
        projectName:
          projects.find((project) => project.id === application.projectId)?.name ??
          application.projectName,
        jobPositionName: application.jobPositionName,
        status: application.status,
        appliedAt: application.appliedAt,
      }))
      .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)),
  };
}

function pendingCountOf(projectId: number) {
  return getApplications().filter(
    (application) => application.projectId === projectId && application.status === 'PENDING',
  ).length;
}

function toProjectSummary(project: ProjectRecord): AdminProjectSummary {
  return {
    projectId: project.id,
    name: project.name,
    imageUrl: project.imageUrl,
    leaderId: project.leaderId,
    leaderName: project.leaderName,
    category: project.category,
    platform: project.platform,
    currentMembers: project.currentMembers,
    targetMembers: 1 + project.recruitments.reduce((total, item) => total + item.count, 0),
    recruitmentStatus: recruitmentStatusOf(project),
    visibility: visibilityOf(project),
    pendingApplicationCount: pendingCountOf(project.id),
    deadline: project.deadline,
    createdAt: project.createdAt,
  };
}

function toProjectDetail(project: ProjectRecord): AdminProjectDetail {
  const members = getMembers();
  const applications = getApplications().filter((item) => item.projectId === project.id);
  const memberIds = [
    project.leaderId,
    ...(project.memberIds ?? []).filter((id) => id !== project.leaderId),
  ];
  return {
    ...toProjectSummary(project),
    description: project.description,
    githubUrl: project.githubUrl || null,
    communicationUrl: project.communicationUrl || null,
    members: memberIds.map((memberId) => {
      const member = members.find((item) => item.memberId === memberId);
      const isLeader = memberId === project.leaderId;
      const positionId = isLeader
        ? project.leaderPositionId
        : applications.find((item) => item.applicantId === memberId && item.status === 'ACCEPTED')
            ?.jobPositionId;
      return {
        memberId,
        name: member?.name ?? (isLeader ? project.leaderName : '팀원'),
        profileImageUrl: member?.profileImageUrl ?? null,
        jobPositionName: positions.find((position) => position.id === positionId)?.name ?? null,
        isLeader,
      };
    }),
    recruitments: toProjectRecruitments(project).map((item) => ({
      jobFieldName: item.jobFieldName,
      jobPositionName: item.jobPositionName,
      recruitmentCount: item.recruitmentCount,
      currentCount: item.currentCount,
      isClosed: item.isClosed,
      techStacks: item.techStacks,
    })),
    applicationStats: {
      PENDING: applications.filter((item) => item.status === 'PENDING').length,
      ACCEPTED: applications.filter((item) => item.status === 'ACCEPTED').length,
      REJECTED: applications.filter((item) => item.status === 'REJECTED').length,
      CANCELLED: applications.filter((item) => item.status === 'CANCELLED').length,
    },
  };
}

function findMember(id: unknown) {
  return getMembers().find((member) => member.memberId === Number(id));
}

function findProject(id: unknown) {
  return getProjects().find((project) => project.id === Number(id));
}

function memberNotFound() {
  return failure(404, 'ADMIN_TARGET_NOT_FOUND', '회원을 찾을 수 없습니다.');
}

function projectNotFound() {
  return failure(404, 'ADMIN_TARGET_NOT_FOUND', '프로젝트를 찾을 수 없습니다.');
}

function invalidState(message: string) {
  return failure(409, 'ADMIN_INVALID_STATE', message);
}

function logMemberAction(
  admin: MockMember,
  target: MockMember,
  action: AuditAction,
  reason: string,
  metadata: Record<string, string | number | null> | null = null,
) {
  appendAuditLog({
    adminId: admin.memberId,
    adminName: admin.name,
    action,
    targetType: 'MEMBER',
    targetId: target.memberId,
    targetName: target.name,
    reason,
    metadata,
  });
}

function logProjectAction(
  admin: MockMember,
  target: ProjectRecord,
  action: AuditAction,
  reason: string,
  metadata: Record<string, string | number | null> | null = null,
) {
  appendAuditLog({
    adminId: admin.memberId,
    adminName: admin.name,
    action,
    targetType: 'PROJECT',
    targetId: target.id,
    targetName: target.name,
    reason,
    metadata,
  });
}

function compareMembers(sort: string) {
  return (a: AdminMemberSummary, b: AdminMemberSummary) => {
    if (sort === 'name,asc') return a.name.localeCompare(b.name, 'ko');
    if (sort === 'projectCount,desc') return b.projectCount - a.projectCount;
    if (sort === 'lastLoginAt,desc')
      return (b.lastLoginAt ?? '').localeCompare(a.lastLoginAt ?? '');
    return b.createdAt.localeCompare(a.createdAt);
  };
}

function compareProjects(sort: string) {
  return (a: AdminProjectSummary, b: AdminProjectSummary) => {
    if (sort === 'name,asc') return a.name.localeCompare(b.name, 'ko');
    if (sort === 'pendingApplicationCount,desc')
      return b.pendingApplicationCount - a.pendingApplicationCount;
    return b.createdAt.localeCompare(a.createdAt);
  };
}

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

export const adminHandlers = [
  http.get('/api/v1/admin/dashboard', async () => {
    await delay(250);
    const admin = requireAdmin();
    if (admin instanceof Response) return admin;
    const members = getMembers().map((member) => toMemberSummary(member));
    const projects = getProjects().map(toProjectSummary);
    const activeMembers = members.filter((member) => member.status !== 'WITHDRAWN');
    const liveProjects = projects.filter((project) => project.visibility !== 'DELETED');
    return success({
      stats: {
        totalMembers: activeMembers.length,
        newMembersToday: activeMembers.filter((member) => isToday(member.createdAt)).length,
        suspendedMembers: members.filter((member) => member.status === 'SUSPENDED').length,
        totalProjects: liveProjects.length,
        recruitingProjects: liveProjects.filter(
          (project) =>
            project.visibility === 'VISIBLE' && project.recruitmentStatus === 'RECRUITING',
        ).length,
        hiddenProjects: projects.filter((project) => project.visibility === 'HIDDEN').length,
        pendingApplications: getApplications().filter((item) => item.status === 'PENDING').length,
      },
      recentMembers: [...activeMembers].sort(compareMembers('createdAt,desc')).slice(0, 5),
      recentProjects: [...liveProjects].sort(compareProjects('createdAt,desc')).slice(0, 5),
      recentAuditLogs: getAuditLogs().slice(0, 5),
    });
  }),

  http.get('/api/v1/admin/members', async ({ request }) => {
    await delay(250);
    const admin = requireAdmin();
    if (admin instanceof Response) return admin;
    const params = new URL(request.url).searchParams;
    const keyword = (params.get('keyword') ?? '').trim().toLocaleLowerCase();
    const status = params.get('status');
    const role = params.get('role');
    const jobFieldCode = params.get('jobFieldCode');
    const members = getMembers().filter(
      (member) =>
        !keyword ||
        `${member.name} ${member.email} ${member.studentId ?? ''}`
          .toLocaleLowerCase()
          .includes(keyword),
    );
    const summaries = members
      .map((member) => toMemberSummary(member))
      .filter(
        (member) =>
          (!status || member.status === status) &&
          (!role || member.role === role) &&
          (!jobFieldCode || member.jobFieldCode === jobFieldCode),
      )
      .sort(compareMembers(params.get('sort') ?? 'createdAt,desc'));
    return success(pageOf(summaries, params));
  }),

  http.get('/api/v1/admin/members/:memberId', async ({ params }) => {
    await delay(200);
    const admin = requireAdmin();
    if (admin instanceof Response) return admin;
    const member = findMember(params.memberId);
    return member ? success(toMemberDetail(member)) : memberNotFound();
  }),

  http.post('/api/v1/admin/members/:memberId/suspend', async ({ params, request }) => {
    const admin = requireAdmin();
    if (admin instanceof Response) return admin;
    const body = await parseBody(request, suspendMemberRequestSchema);
    if (body instanceof Response) return body;
    const member = findMember(params.memberId);
    if (!member) return memberNotFound();
    if (member.memberId === admin.memberId)
      return failure(400, 'ADMIN_SELF_ACTION', '본인 계정은 정지할 수 없습니다.');
    const status: MemberStatus = getMemberStatus(member);
    if (status === 'WITHDRAWN') return invalidState('탈퇴한 회원은 정지할 수 없습니다.');
    if (status === 'SUSPENDED') return invalidState('이미 정지된 회원입니다.');
    const next: MockMember = {
      ...member,
      status: 'SUSPENDED',
      suspendedUntil: body.days ? new Date(Date.now() + body.days * DAY_MS).toISOString() : null,
      suspendReason: body.reason,
    };
    updateMember(next);
    logMemberAction(admin, next, 'MEMBER_SUSPEND', body.reason, { days: body.days });
    return success(toMemberSummary(next));
  }),

  http.post('/api/v1/admin/members/:memberId/unsuspend', async ({ params, request }) => {
    const admin = requireAdmin();
    if (admin instanceof Response) return admin;
    const body = await parseBody(request, reasonRequestSchema);
    if (body instanceof Response) return body;
    const member = findMember(params.memberId);
    if (!member) return memberNotFound();
    if (getMemberStatus(member) !== 'SUSPENDED')
      return invalidState('정지 상태가 아닌 회원입니다.');
    const next: MockMember = {
      ...member,
      status: 'ACTIVE',
      suspendedUntil: null,
      suspendReason: null,
    };
    updateMember(next);
    logMemberAction(admin, next, 'MEMBER_UNSUSPEND', body.reason);
    return success(toMemberSummary(next));
  }),

  http.patch('/api/v1/admin/members/:memberId/role', async ({ params, request }) => {
    const admin = requireAdmin();
    if (admin instanceof Response) return admin;
    const body = await parseBody(request, changeRoleRequestSchema);
    if (body instanceof Response) return body;
    const member = findMember(params.memberId);
    if (!member) return memberNotFound();
    if (member.memberId === admin.memberId)
      return failure(400, 'ADMIN_SELF_ACTION', '본인 계정의 권한은 변경할 수 없습니다.');
    if (getMemberStatus(member) === 'WITHDRAWN')
      return invalidState('탈퇴한 회원의 권한은 변경할 수 없습니다.');
    const currentRole = member.role ?? 'USER';
    if (currentRole === body.role) return invalidState('이미 같은 권한입니다.');
    const adminCount = getMembers().filter(
      (item) => item.role === 'ADMIN' && getMemberStatus(item) !== 'WITHDRAWN',
    ).length;
    if (currentRole === 'ADMIN' && adminCount <= 1)
      return failure(409, 'ADMIN_LAST_ADMIN', '마지막 관리자의 권한은 해제할 수 없습니다.');
    const next: MockMember = { ...member, role: body.role };
    updateMember(next);
    logMemberAction(admin, next, 'MEMBER_ROLE_CHANGE', body.reason, {
      from: currentRole,
      to: body.role,
    });
    return success(toMemberSummary(next));
  }),

  http.post('/api/v1/admin/members/:memberId/withdraw', async ({ params, request }) => {
    const admin = requireAdmin();
    if (admin instanceof Response) return admin;
    const body = await parseBody(request, reasonRequestSchema);
    if (body instanceof Response) return body;
    const member = findMember(params.memberId);
    if (!member) return memberNotFound();
    if (member.memberId === admin.memberId)
      return failure(400, 'ADMIN_SELF_ACTION', '본인 계정은 탈퇴 처리할 수 없습니다.');
    if (getMemberStatus(member) === 'WITHDRAWN') return invalidState('이미 탈퇴한 회원입니다.');
    const ledProjects = getProjects().filter(
      (project) => project.leaderId === member.memberId && visibilityOf(project) === 'VISIBLE',
    );
    if (ledProjects.length)
      return failure(
        409,
        'MEMBER_HAS_LED_PROJECTS',
        `노출 중인 리더 프로젝트 ${ledProjects.length}개를 먼저 숨김 또는 삭제해 주세요.`,
      );
    getApplications()
      .filter((item) => item.applicantId === member.memberId && item.status === 'PENDING')
      .forEach((item) =>
        saveApplication({ ...item, status: 'CANCELLED', statusDisplayName: '취소됨' }),
      );
    getProjects()
      .filter((project) => project.memberIds?.includes(member.memberId))
      .forEach((project) => removeMember(project, member.memberId));
    const next: MockMember = {
      ...member,
      status: 'WITHDRAWN',
      suspendedUntil: null,
      suspendReason: null,
      isParticipating: false,
    };
    updateMember(next);
    logMemberAction(admin, next, 'MEMBER_WITHDRAW', body.reason);
    return success(toMemberSummary(next));
  }),

  http.get('/api/v1/admin/projects', async ({ request }) => {
    await delay(250);
    const admin = requireAdmin();
    if (admin instanceof Response) return admin;
    const params = new URL(request.url).searchParams;
    const keyword = (params.get('keyword') ?? '').trim().toLocaleLowerCase();
    const category = params.get('category');
    const recruitmentStatus = params.get('recruitmentStatus');
    const visibility = params.get('visibility');
    const projects = getProjects()
      .map(toProjectSummary)
      .filter(
        (project) =>
          (!keyword ||
            `${project.name} ${project.leaderName}`.toLocaleLowerCase().includes(keyword)) &&
          (!category || project.category === category) &&
          (!recruitmentStatus || project.recruitmentStatus === recruitmentStatus) &&
          (!visibility || project.visibility === visibility),
      )
      .sort(compareProjects(params.get('sort') ?? 'createdAt,desc'));
    return success(pageOf(projects, params));
  }),

  http.get('/api/v1/admin/projects/:projectId', async ({ params }) => {
    await delay(200);
    const admin = requireAdmin();
    if (admin instanceof Response) return admin;
    const project = findProject(params.projectId);
    return project ? success(toProjectDetail(project)) : projectNotFound();
  }),

  http.patch('/api/v1/admin/projects/:projectId/visibility', async ({ params, request }) => {
    const admin = requireAdmin();
    if (admin instanceof Response) return admin;
    const body = await parseBody(request, changeVisibilityRequestSchema);
    if (body instanceof Response) return body;
    const project = findProject(params.projectId);
    if (!project) return projectNotFound();
    const current = visibilityOf(project);
    if (current === body.visibility) return invalidState('이미 같은 노출 상태입니다.');
    const next: ProjectRecord = { ...project, visibility: body.visibility };
    replaceMockProject(next);
    const action: AuditAction =
      body.visibility === 'VISIBLE'
        ? 'PROJECT_RESTORE'
        : body.visibility === 'HIDDEN'
          ? 'PROJECT_HIDE'
          : 'PROJECT_DELETE';
    logProjectAction(admin, next, action, body.reason, { from: current, to: body.visibility });
    return success(toProjectSummary(next));
  }),

  http.post('/api/v1/admin/projects/:projectId/close', async ({ params, request }) => {
    const admin = requireAdmin();
    if (admin instanceof Response) return admin;
    const body = await parseBody(request, reasonRequestSchema);
    if (body instanceof Response) return body;
    const project = findProject(params.projectId);
    if (!project) return projectNotFound();
    if (recruitmentStatusOf(project) === 'CLOSED')
      return invalidState('이미 모집이 마감되었습니다.');
    const next: ProjectRecord = {
      ...project,
      recruitmentStatus: 'CLOSED',
      recruitments: project.recruitments.map((item) => ({ ...item, closed: true })),
    };
    replaceMockProject(next);
    logProjectAction(admin, next, 'PROJECT_FORCE_CLOSE', body.reason);
    return success(toProjectSummary(next));
  }),

  http.post(
    '/api/v1/admin/projects/:projectId/members/:memberId/expel',
    async ({ params, request }) => {
      const admin = requireAdmin();
      if (admin instanceof Response) return admin;
      const body = await parseBody(request, reasonRequestSchema);
      if (body instanceof Response) return body;
      const project = findProject(params.projectId);
      if (!project) return projectNotFound();
      const memberId = Number(params.memberId);
      if (memberId === project.leaderId)
        return failure(400, 'PROJECT_LEADER_EXPEL', '리더는 팀원에서 제외할 수 없습니다.');
      if (!project.memberIds?.includes(memberId))
        return failure(404, 'ADMIN_TARGET_NOT_FOUND', '팀원을 찾을 수 없습니다.');
      removeMember(project, memberId);
      logProjectAction(admin, project, 'PROJECT_MEMBER_EXPEL', body.reason, {
        memberId,
        memberName: findMember(memberId)?.name ?? null,
      });
      const next = findProject(project.id) ?? project;
      return success(toProjectSummary(next));
    },
  ),

  http.get('/api/v1/admin/audit-logs', async ({ request }) => {
    await delay(200);
    const admin = requireAdmin();
    if (admin instanceof Response) return admin;
    const params = new URL(request.url).searchParams;
    const action = params.get('action');
    const targetType = params.get('targetType');
    const targetId = Number(params.get('targetId'));
    const logs = getAuditLogs()
      .filter(
        (log) =>
          (!action || log.action === action) &&
          (!targetType || log.targetType === targetType) &&
          (!targetId || log.targetId === targetId),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return success(pageOf(logs, params));
  }),
];
