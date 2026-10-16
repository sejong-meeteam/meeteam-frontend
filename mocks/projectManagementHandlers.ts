import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { JOB_OPTIONS } from './fixtures';
import {
  getApplications,
  getMembers,
  getProjects,
  getSessionMember,
  saveApplication,
} from './storage';
import { backendProjectCreateSchema, projectCreateSchema } from './projectSchema';
import { addMockNotification } from './notificationHandlers';
import type { ProjectRecord } from './projectContract';

const success = <T>(result: T) => HttpResponse.json({ code: 'COMMON200', result });
const failure = (status: number, message: string) => HttpResponse.json({ message }, { status });
const positions = JOB_OPTIONS.fields.flatMap((field) => field.positions);
export function replaceMockProject(project: ProjectRecord) {
  localStorage.setItem(
    'meeteam-week5-projects',
    JSON.stringify(getProjects().map((item) => (item.id === project.id ? project : item))),
  );
}
function ownedProject(id: unknown): ProjectRecord | Response {
  const member = getSessionMember();
  if (!member) return failure(401, '로그인이 필요합니다.');
  const project = getProjects().find((item) => item.id === Number(id));
  if (!project) return failure(404, '프로젝트를 찾을 수 없습니다.');
  return project.leaderId === member.memberId
    ? project
    : failure(403, '프로젝트 관리 권한이 없습니다.');
}
function syncStatus(project: ProjectRecord): ProjectRecord {
  const recruitments = project.recruitments.map((item) => ({
    ...item,
    closed: (item.currentCount ?? 0) >= item.count,
  }));
  return {
    ...project,
    recruitments,
    recruitmentStatus:
      project.recruitmentStatus === 'SUSPENDED'
        ? 'SUSPENDED'
        : recruitments.every((item) => item.closed)
          ? 'CLOSED'
          : 'RECRUITING',
  };
}
function removeMember(project: ProjectRecord, memberId: number) {
  const application = getApplications().find(
    (item) =>
      item.projectId === project.id && item.applicantId === memberId && item.status === 'ACCEPTED',
  );
  const next = syncStatus({
    ...project,
    currentMembers: Math.max(1, project.currentMembers - 1),
    memberIds: project.memberIds?.filter((id) => id !== memberId),
    recruitments: project.recruitments.map((item) =>
      item.jobPositionId === application?.jobPositionId
        ? { ...item, currentCount: Math.max(0, (item.currentCount ?? 0) - 1) }
        : item,
    ),
  });
  replaceMockProject(next);
}

export const projectManagementHandlers = [
  http.post('/api/v1/projects/:projectId/recruitment/toggle', ({ params }) => {
    const project = ownedProject(params.projectId);
    if (project instanceof Response) return project;
    if (project.recruitmentStatus === 'CLOSED')
      return failure(400, '모집 완료 상태는 변경할 수 없습니다.');
    const recruitmentStatus =
      project.recruitmentStatus === 'SUSPENDED' ? 'RECRUITING' : 'SUSPENDED';
    replaceMockProject({ ...project, recruitmentStatus });
    return success({
      projectId: project.id,
      recruitmentStatus,
      isRecruiting: recruitmentStatus === 'RECRUITING',
    });
  }),
  http.get('/api/v1/projects/:projectId/edit', ({ params }) => {
    const project = ownedProject(params.projectId);
    if (project instanceof Response) return project;
    const leaderField = JOB_OPTIONS.fields.find((field) =>
      field.positions.some((item) => item.id === project.leaderPositionId),
    );
    return success({
      projectId: project.id,
      name: project.name,
      description: project.description,
      projectCategory: project.category,
      platformCategory: project.platform,
      imageUrl: project.imageUrl,
      githubRepositoryUrl: project.githubUrl,
      communicationChannelUrl: project.communicationUrl,
      recruitmentDeadlineType: project.closeWhenFull ? 'RECRUITMENT_COMPLETED' : 'END_DATE',
      endDate: project.deadline,
      leaderJobFieldName: leaderField?.name,
      leaderJobPositionName: positions.find((item) => item.id === project.leaderPositionId)?.name,
      editable: project.recruitmentStatus !== 'SUSPENDED',
      notEditableReason:
        project.recruitmentStatus === 'SUSPENDED' ? '모집을 재개한 후 수정해주세요.' : null,
      recruitments: project.recruitments.map((item, index) => {
        const field = JOB_OPTIONS.fields.find((field) => field.code === item.jobFieldCode);
        return {
          recruitmentStateId: index + 1,
          jobFieldName: field?.name,
          jobPositionName: positions.find((position) => position.id === item.jobPositionId)?.name,
          recruitmentCount: item.count,
          currentCount: item.currentCount ?? 0,
          minRecruitmentCount: item.currentCount ?? 0,
          deletable: !item.currentCount,
          pendingApplicationCount: getApplications().filter(
            (application) =>
              application.projectId === project.id &&
              application.jobPositionId === item.jobPositionId &&
              application.status === 'PENDING',
          ).length,
          techStackNames:
            field?.techStacks
              .filter((skill) => item.techStackIds.includes(skill.id))
              .map((skill) => skill.name) ?? [],
        };
      }),
    });
  }),
  http.put('/api/v1/projects/:projectId', async ({ params, request }) => {
    const project = ownedProject(params.projectId);
    if (project instanceof Response) return project;
    if (project.recruitmentStatus === 'SUSPENDED')
      return failure(400, '모집을 재개한 후 수정해주세요.');
    const data = await request.formData();
    const raw = data.get('request');
    const payload = z
      .object({
        name: z.string(),
        leaderJobPositionCode: z.string(),
        confirmDeletePositionsWithPendingApplicants: z.boolean().optional(),
      })
      .passthrough()
      .safeParse(JSON.parse(raw instanceof Blob ? await raw.text() : String(raw)));
    if (!payload.success) return failure(400, '수정 정보를 확인해 주세요.');
    const value = payload.data;
    const backend = backendProjectCreateSchema.safeParse({
      ...value,
      projectName: value.name,
      creatorJobPositionCode: value.leaderJobPositionCode,
    });
    const parsed = projectCreateSchema.safeParse(backend.success ? backend.data : null);
    if (!parsed.success) return failure(400, '입력값을 확인해 주세요.');
    for (const previous of project.recruitments) {
      const next = parsed.data.recruitments.find(
        (item) => item.jobPositionId === previous.jobPositionId,
      );
      if ((previous.currentCount ?? 0) > (next?.count ?? 0))
        return failure(400, '승인된 인원보다 모집 인원을 줄일 수 없습니다.');
    }
    const removed = project.recruitments.filter(
      (item) => !parsed.data.recruitments.some((next) => next.jobPositionId === item.jobPositionId),
    );
    const pending = getApplications().filter(
      (item) =>
        item.projectId === project.id &&
        item.status === 'PENDING' &&
        removed.some((recruitment) => recruitment.jobPositionId === item.jobPositionId),
    );
    if (pending.length && !value.confirmDeletePositionsWithPendingApplicants)
      return failure(409, '대기 지원자가 있는 모집 직무 삭제 확인이 필요합니다.');
    for (const application of pending)
      saveApplication({ ...application, status: 'REJECTED', statusDisplayName: '거절됨' });
    const next = syncStatus({
      ...project,
      ...parsed.data,
      recruitments: parsed.data.recruitments.map((item) => ({
        ...item,
        currentCount:
          project.recruitments.find((previous) => previous.jobPositionId === item.jobPositionId)
            ?.currentCount ?? 0,
      })),
    });
    replaceMockProject(next);
    return success({
      projectId: next.id,
      name: next.name,
      recruitmentStatus: next.recruitmentStatus,
      autoRejectedApplicantCount: pending.length,
    });
  }),
  http.post(
    '/api/v1/projects/:projectId/applications/:applicationId/decision',
    async ({ params, request }) => {
      const project = ownedProject(params.projectId);
      if (project instanceof Response) return project;
      const parsed = z
        .object({ decision: z.enum(['ACCEPTED', 'REJECTED']) })
        .safeParse(await request.json());
      if (!parsed.success) return failure(400, '처리 상태를 확인해 주세요.');
      const application = getApplications().find(
        (item) =>
          item.applicationId === Number(params.applicationId) && item.projectId === project.id,
      );
      if (!application) return failure(404, '지원서를 찾을 수 없습니다.');
      if (application.status !== 'PENDING')
        return failure(400, '대기 중인 지원서만 처리할 수 있습니다.');
      const recruitment = project.recruitments.find(
        (item) => item.jobPositionId === application.jobPositionId,
      );
      if (parsed.data.decision === 'ACCEPTED') {
        if (project.recruitmentStatus === 'SUSPENDED' || project.recruitmentStatus === 'CLOSED')
          return failure(400, '모집 중인 프로젝트만 승인할 수 있습니다.');
        if (
          !recruitment ||
          recruitment.closed ||
          (recruitment.currentCount ?? 0) >= recruitment.count
        )
          return failure(400, '모집 정원을 초과했습니다.');
        replaceMockProject(
          syncStatus({
            ...project,
            currentMembers: project.currentMembers + 1,
            memberIds: [...(project.memberIds ?? []), application.applicantId],
            recruitments: project.recruitments.map((item) =>
              item === recruitment ? { ...item, currentCount: (item.currentCount ?? 0) + 1 } : item,
            ),
          }),
        );
      }
      saveApplication({
        ...application,
        status: parsed.data.decision,
        statusDisplayName: parsed.data.decision === 'ACCEPTED' ? '승인됨' : '거절됨',
      });
      addMockNotification(
        application.applicantId,
        parsed.data.decision === 'ACCEPTED' ? 'PROJECT_APPROVE' : 'PROJECT_REJECT',
        project.id,
        project.name,
      );
      return success({
        applicationId: application.applicationId,
        projectId: project.id,
        applicantId: application.applicantId,
        decision: parsed.data.decision,
      });
    },
  ),
  http.delete('/api/v1/projects/:projectId/members/:memberId', ({ params }) => {
    const project = ownedProject(params.projectId);
    if (project instanceof Response) return project;
    const memberId = Number(params.memberId);
    if (memberId === project.leaderId) return failure(400, '리더는 방출할 수 없습니다.');
    if (!project.memberIds?.includes(memberId)) return failure(404, '팀원을 찾을 수 없습니다.');
    removeMember(project, memberId);
    return success({
      projectId: project.id,
      expelledMemberId: memberId,
      expelledMemberName: getMembers().find((item) => item.memberId === memberId)?.name ?? '',
    });
  }),
  http.post('/api/project-members/withdraw', async ({ request }) => {
    const member = getSessionMember();
    if (!member) return failure(401, '로그인이 필요합니다.');
    const parsed = z
      .object({ projectId: z.number().int().positive() })
      .safeParse(await request.json());
    if (!parsed.success) return failure(400, '프로젝트를 확인해 주세요.');
    const project = getProjects().find((item) => item.id === parsed.data.projectId);
    if (!project) return failure(404, '프로젝트를 찾을 수 없습니다.');
    if (project.leaderId === member.memberId) return failure(403, '리더는 탈퇴할 수 없습니다.');
    if (!project.memberIds?.includes(member.memberId))
      return failure(403, '참여 중인 팀원만 탈퇴할 수 있습니다.');
    removeMember(project, member.memberId);
    return success({ projectId: project.id, memberId: member.memberId });
  }),
  http.delete('/api/v1/projects/:projectId', ({ params }) => {
    const project = ownedProject(params.projectId);
    if (project instanceof Response) return project;
    localStorage.setItem(
      'meeteam-week5-projects',
      JSON.stringify(getProjects().filter((item) => item.id !== project.id)),
    );
    return success({ projectId: project.id });
  }),
];
