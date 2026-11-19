import { delay, http, HttpResponse } from 'msw';
import { projectProposalRequestSchema } from '@/components/features/project/proposal/schema';
import { findUniversityByEmail } from '@/components/shared/universityLogoRegistry';
import type { ProjectProposal, ProposablePosition, ProposableProject } from '@/types/proposal';
import { JOB_OPTIONS, type MockMember } from './fixtures';
import { addMockNotification } from './notificationHandlers';
import {
  isProjectOpen,
  isProjectVisible,
  isRecruitmentOpen,
  type ProjectRecord,
} from './projectContract';
import { getMemberStatus, getMembers, getProjects, getSessionMember } from './storage';

type MockProposal = ProjectProposal & { proposerId: number };

const PROPOSALS_KEY = 'meeteam-project-proposals';
export const DAILY_PROPOSAL_LIMIT = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getMockProposals(): MockProposal[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(PROPOSALS_KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as MockProposal[]) : [];
  } catch {
    return [];
  }
}

function saveMockProposal(proposal: MockProposal) {
  localStorage.setItem(PROPOSALS_KEY, JSON.stringify([proposal, ...getMockProposals()]));
}

function success<T>(result: T) {
  return HttpResponse.json({ code: 'COMMON200', message: '요청에 성공했습니다.', result });
}

function failure(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message, result: null }, { status });
}

function findActiveMember(memberId: number) {
  return getMembers().find(
    (member) => member.memberId === memberId && getMemberStatus(member) === 'ACTIVE',
  );
}

function isSameUniversity(a: MockMember, b: MockMember) {
  return (
    (findUniversityByEmail(a.email)?.id ?? null) === (findUniversityByEmail(b.email)?.id ?? null)
  );
}

function isOnTeam(project: ProjectRecord, memberId: number) {
  return project.leaderId === memberId || Boolean(project.memberIds?.includes(memberId));
}

function hasPendingProposal(projectId: number, memberId: number) {
  return getMockProposals().some(
    (proposal) =>
      proposal.projectId === projectId &&
      proposal.memberId === memberId &&
      proposal.status === 'PENDING',
  );
}

function toPosition(jobPositionId: number): ProposablePosition | null {
  for (const field of JOB_OPTIONS.fields) {
    const position = field.positions.find((item) => item.id === jobPositionId);
    if (position)
      return { jobPositionId, jobFieldName: field.name, jobPositionName: position.name };
  }
  return null;
}

function openPositionsOf(project: ProjectRecord) {
  return project.recruitments
    .filter(isRecruitmentOpen)
    .map((recruitment) => toPosition(recruitment.jobPositionId))
    .filter((position): position is ProposablePosition => position !== null);
}

function proposableProjects(leader: MockMember, target: MockMember): ProposableProject[] {
  return getProjects()
    .filter(
      (project) =>
        project.leaderId === leader.memberId &&
        isProjectVisible(project) &&
        isProjectOpen(project) &&
        !isOnTeam(project, target.memberId),
    )
    .map((project) => ({
      projectId: project.id,
      projectName: project.name,
      openPositions: openPositionsOf(project),
      hasPendingProposal: hasPendingProposal(project.id, target.memberId),
    }))
    .filter((project) => project.openPositions.length > 0);
}

export const proposalHandlers = [
  http.get('/api/v1/members/:memberId/proposable-projects', async ({ params }) => {
    await delay(200);
    const leader = getSessionMember();
    if (!leader) return failure(401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    const target = findActiveMember(Number(params.memberId));
    if (!target) return failure(404, 'MEMBER404', '회원을 찾을 수 없습니다.');
    if (target.memberId === leader.memberId)
      return failure(400, 'PROPOSAL400', '나에게는 제안을 보낼 수 없어요.');
    if (!isSameUniversity(leader, target))
      return failure(
        403,
        'PROPOSAL_DIFFERENT_UNIVERSITY',
        '같은 학교 회원에게만 제안할 수 있어요.',
      );
    return success(proposableProjects(leader, target));
  }),

  http.post('/api/v1/projects/:projectId/proposals', async ({ params, request }) => {
    await delay(300);
    const leader = getSessionMember();
    if (!leader) return failure(401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    const parsed = projectProposalRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return failure(
        400,
        'PROPOSAL400',
        parsed.error.issues[0]?.message ?? '제안 내용을 확인해 주세요.',
      );
    const { memberId, jobPositionId, message } = parsed.data;

    const project = getProjects().find(
      (item) => item.id === Number(params.projectId) && isProjectVisible(item),
    );
    if (!project) return failure(404, 'PROJECT404', '프로젝트를 찾을 수 없습니다.');
    if (project.leaderId !== leader.memberId)
      return failure(403, 'PROPOSAL403', '프로젝트 리더만 제안을 보낼 수 있어요.');
    if (!isProjectOpen(project))
      return failure(
        409,
        'PROPOSAL_PROJECT_NOT_RECRUITING',
        '모집 중인 프로젝트로만 제안할 수 있어요.',
      );

    const target = findActiveMember(memberId);
    if (!target) return failure(404, 'MEMBER404', '회원을 찾을 수 없습니다.');
    if (target.memberId === leader.memberId)
      return failure(400, 'PROPOSAL400', '나에게는 제안을 보낼 수 없어요.');
    if (!isSameUniversity(leader, target))
      return failure(
        403,
        'PROPOSAL_DIFFERENT_UNIVERSITY',
        '같은 학교 회원에게만 제안할 수 있어요.',
      );
    if (isOnTeam(project, target.memberId))
      return failure(409, 'PROPOSAL_ALREADY_MEMBER', '이미 프로젝트에 함께하고 있는 회원이에요.');

    const position = openPositionsOf(project).find((item) => item.jobPositionId === jobPositionId);
    if (!position)
      return failure(409, 'PROPOSAL_POSITION_CLOSED', '모집 중인 포지션을 선택해 주세요.');
    if (hasPendingProposal(project.id, target.memberId))
      return failure(
        409,
        'PROPOSAL_DUPLICATE',
        `이미 '${project.name}' 프로젝트로 ${target.name}님에게 보낸 제안이 있어요.`,
      );

    const since = Date.now() - DAY_MS;
    const sentToday = getMockProposals().filter(
      (proposal) =>
        proposal.proposerId === leader.memberId && new Date(proposal.createdAt).getTime() > since,
    ).length;
    if (sentToday >= DAILY_PROPOSAL_LIMIT)
      return failure(
        429,
        'PROPOSAL_RATE_LIMITED',
        `제안은 하루 ${DAILY_PROPOSAL_LIMIT}건까지 보낼 수 있어요. 내일 다시 시도해 주세요.`,
      );

    const proposals = getMockProposals();
    const proposal: ProjectProposal = {
      proposalId: Math.max(0, ...proposals.map((item) => item.proposalId)) + 1,
      projectId: project.id,
      memberId: target.memberId,
      jobPositionId,
      message,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    saveMockProposal({ ...proposal, proposerId: leader.memberId });
    addMockNotification(
      target.memberId,
      'PROJECT_PROPOSAL_RECEIVED',
      project.id,
      project.name,
      undefined,
      undefined,
      {
        proposerId: leader.memberId,
        proposerName: leader.name,
        jobFieldName: position.jobFieldName,
        jobPositionName: position.jobPositionName,
        proposalMessage: message || undefined,
      },
    );

    return success(proposal);
  }),
];
