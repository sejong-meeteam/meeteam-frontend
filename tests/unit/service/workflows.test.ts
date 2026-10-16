import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers } from '@/mocks/handlers';
import { getProjects, getMembers, saveMember, setSession, clearSession } from '@/mocks/storage';
import { addMockNotification } from '@/mocks/notificationHandlers';
import { replaceMockProject } from '@/mocks/projectManagementHandlers';
import { JOB_OPTIONS } from '@/mocks/fixtures';
import { loginMember, logoutMember } from '@/components/features/auth/loginApi';
import { fetchMyProfile, updateMyProfile } from '@/components/features/profile/profileApi';
import * as projectApi from '@/components/features/project/projectApi';
import * as qnaApi from '@/components/features/project/detail/projectQnaApi';
import * as notifications from '@/components/features/notification/notificationApi';
import { fetchProjectSearchResults } from '@/components/features/project/find/projectFindApi';

const server = setupServer(...handlers);
const nativeFetch = globalThis.fetch;
const stored = new Map<string, string>();
beforeAll(() => {
  vi.stubGlobal('location', new URL('http://localhost:3000'));
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
    removeItem: (key: string) => stored.delete(key),
  });
  server.listen({ onUnhandledRequest: 'error' });
  const intercepted = globalThis.fetch;
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
    intercepted(typeof input === 'string' ? new URL(input, 'http://localhost:3000') : input, init),
  );
});
beforeEach(() => {
  stored.clear();
  setSession(1);
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
  globalThis.fetch = nativeFetch;
});

const backendField = JOB_OPTIONS.fields.find((field) => field.code === 'BACKEND')!;
const position = backendField.positions[0];
const createPayload: Parameters<typeof projectApi.createProject>[0] = {
  projectName: '통합 검증 프로젝트',
  description: '사용자 흐름과 상태 변경을 검증하는 프로젝트입니다.',
  projectCategory: 'CAPSTONE',
  platformCategory: 'WEB',
  githubRepositoryUrl: '',
  communicationChannelUrl: '',
  creatorJobPositionCode: JOB_OPTIONS.fields[0].positions[0].code,
  recruitmentDeadlineType: 'RECRUITMENT_COMPLETED',
  recruitments: [
    {
      jobFieldCode: backendField.code,
      jobPositionCode: position.code,
      recruitmentCount: 1,
      techStackIds: [backendField.techStacks[0].id],
    },
  ],
};
const applicationPayload = {
  jobPositionCode: position.code,
  motivation: '팀과 함께 기능을 개발하고 테스트를 작성하고 싶습니다.',
};

async function createAndApply() {
  const { id } = await projectApi.createProject(createPayload);
  setSession(2);
  const application = await projectApi.applyToProject(id, applicationPayload);
  setSession(1);
  return { id, application };
}

describe('MSW service integration (not live-server E2E)', () => {
  it('로그인 → 프로필 저장 → 프로젝트 등록·수정 → 지원·승인 → 팀원·알림·자동 마감 갱신 → 탈퇴 → 삭제', async () => {
    clearSession();
    await expect(
      loginMember({ studentId: '20260001', password: 'demo1234' }),
    ).resolves.toMatchObject({ isNewMember: false });
    const profile = await fetchMyProfile();
    await updateMyProfile({
      name: '통합테스트회원',
      age: 24,
      gender: profile.gender,
      jobPositionIds: [1],
      techStacks: [{ id: 1, displayOrder: 1 }],
      isParticipating: true,
      introduction: '통합 테스트 소개',
    });
    expect((await fetchMyProfile()).name).toBe('통합테스트회원');
    const { id } = await projectApi.createProject(createPayload);
    const prefill = await projectApi.fetchProjectEditPrefill(id);
    await projectApi.updateProject(
      id,
      projectApi.buildProjectEditPayload(
        { ...prefill.values, projectName: '수정된 프로젝트' },
        JOB_OPTIONS.fields,
      ),
    );
    expect((await projectApi.fetchProjectDetail(id)).title).toBe('수정된 프로젝트');
    expect(
      (
        await fetchProjectSearchResults(
          {
            searchValue: '수정된 프로젝트',
            category: '모든 카테고리',
            recruitOnly: 'all',
            platform: '전체',
            field: '전체',
            sort: 'latest',
          },
          0,
          10,
        )
      ).projects.some((item) => String(item.id) === String(id)),
    ).toBe(true);
    await expect(projectApi.toggleProjectRecruitmentStatus(id)).resolves.toMatchObject({
      recruitmentStatus: 'SUSPENDED',
    });
    expect((await projectApi.fetchProjectEditPrefill(id)).editable).toBe(false);
    await projectApi.toggleProjectRecruitmentStatus(id);
    setSession(2);
    const application = await projectApi.applyToProject(id, applicationPayload);
    expect((await projectApi.fetchMyProjectApplications())[0].status).toBe('pending');
    setSession(1);
    expect(await notifications.fetchUnreadNotificationCount()).toBe(1);
    expect(await projectApi.fetchProjectApplications(id)).toHaveLength(1);
    expect(
      (await projectApi.fetchProjectApplicationDetail(id, application.applicationId)).introduction,
    ).toBe(applicationPayload.motivation);
    await projectApi.decideProjectApplication(id, application.applicationId, 'ACCEPTED');
    expect(await projectApi.fetchProjectApplications(id)).toHaveLength(0);
    const team = await projectApi.fetchProjectTeamManagement(id);
    expect(team.members.some((member) => member.id === 2)).toBe(true);
    expect(team.currentMemberCount).toBe(2);
    expect((await projectApi.fetchProjectDetail(id)).recruitmentStatus).toBe('CLOSED');
    setSession(2);
    expect((await projectApi.fetchMyProjectApplications())[0].status).toBe('approved');
    const list = await notifications.fetchNotifications();
    expect(list.notifications.some((item) => item.type === 'PROJECT_APPROVE')).toBe(true);
    expect(await notifications.fetchUnreadNotificationCount()).toBe(0);
    await projectApi.leaveProject(id);
    setSession(1);
    expect((await projectApi.fetchProjectTeamManagement(id)).currentMemberCount).toBe(1);
    await projectApi.deleteProject(id);
    await expect(projectApi.fetchProjectDetail(id)).rejects.toThrow();
    await logoutMember();
    await expect(projectApi.fetchProjectTeamManagement(102)).rejects.toThrow();
  }, 10000);

  it('승인·방출 후 인원과 상세를 재조회하고 리더 방출·비리더 변경을 거절한다', async () => {
    const { id, application } = await createAndApply();
    await projectApi.decideProjectApplication(id, application.applicationId, 'ACCEPTED');
    await expect(projectApi.expelProjectMember(id, 1)).rejects.toThrow('리더');
    await projectApi.expelProjectMember(id, 2);
    expect(
      (await projectApi.fetchProjectTeamManagement(id)).members.some((item) => item.id === 2),
    ).toBe(false);
    expect((await projectApi.fetchProjectDetail(id)).recruitmentStatus).toBe('RECRUITING');
    setSession(2);
    await expect(projectApi.deleteProject(id)).rejects.toThrow('권한');
    await expect(projectApi.fetchProjectEditPrefill(id)).rejects.toThrow('권한');
    await expect(projectApi.toggleProjectRecruitmentStatus(id)).rejects.toThrow('권한');
  });

  it('거절 이후 지원 상태를 갱신하고 결정된 지원서의 재처리를 차단한다', async () => {
    const { id, application } = await createAndApply();
    await projectApi.decideProjectApplication(id, application.applicationId, 'REJECTED');
    await expect(
      projectApi.decideProjectApplication(id, application.applicationId, 'ACCEPTED'),
    ).rejects.toThrow('대기');
    setSession(2);
    expect((await projectApi.fetchMyProjectApplications())[0].status).toBe('rejected');
    expect(
      (await notifications.fetchNotifications()).notifications.some(
        (item) => item.type === 'PROJECT_REJECT',
      ),
    ).toBe(true);
  });

  it('마감·정원 초과 승인과 비리더 지원자 상세 조회를 거절한다', async () => {
    const { id, application } = await createAndApply();
    const project = getProjects().find((item) => item.id === id)!;
    replaceMockProject({
      ...project,
      recruitments: project.recruitments.map((item) => ({ ...item, currentCount: item.count })),
    });
    await expect(
      projectApi.decideProjectApplication(id, application.applicationId, 'ACCEPTED'),
    ).rejects.toThrow('정원');
    setSession(2);
    await expect(projectApi.fetchProjectApplications(id)).rejects.toThrow('권한');
  });

  it('비밀 질문·리더 답변을 작성하고 비회원·다른 회원에게 내용과 답변을 숨긴다', async () => {
    const { id } = await projectApi.createProject(createPayload);
    setSession(2);
    const question = await qnaApi.createProjectQnaQuestion(id, '연락처는 어떻게 공유하나요?', true);
    setSession(1);
    await qnaApi.createProjectQnaAnswer(id, question.id, '가입 후 공유합니다.');
    expect((await qnaApi.fetchProjectQnas(id)).qnas[0].answers).toHaveLength(1);
    setSession(2);
    expect((await qnaApi.fetchProjectQnas(id)).qnas[0].question).toContain('연락처');
    saveMember({ ...getMembers()[1], memberId: 3 });
    setSession(3);
    expect((await qnaApi.fetchProjectQnas(id)).qnas[0]).toMatchObject({
      question: '비밀글입니다.',
      answers: [],
    });
    await expect(qnaApi.createProjectQnaAnswer(id, question.id, '타인 답변')).rejects.toThrow(
      '리더',
    );
    clearSession();
    expect((await qnaApi.fetchProjectQnas(id)).qnas[0]).toMatchObject({
      question: '비밀글입니다.',
      answers: [],
    });
    await expect(qnaApi.createProjectQnaQuestion(id, '비회원 질문')).rejects.toThrow();
    await expect(qnaApi.createProjectQnaAnswer(id, question.id, '비회원 답변')).rejects.toThrow();
  });

  it('전체 읽음은 미조회 페이지까지 처리하되 다른 회원의 알림은 변경하지 않는다', async () => {
    for (let index = 0; index < 25; index++)
      addMockNotification(1, 'PROJECT_APPROVE', 102, '테스트');
    addMockNotification(2, 'PROJECT_APPROVE', 102, '다른 회원');
    expect(await notifications.fetchUnreadNotificationCount()).toBe(25);
    await notifications.fetchNotifications(0, 1);
    expect(await notifications.fetchUnreadNotificationCount()).toBe(0);
    setSession(2);
    expect(await notifications.fetchUnreadNotificationCount()).toBe(1);
  });

  it('읽음 처리 실패 시 서버 미확인 개수를 유지하며 재시도하면 저장한다', async () => {
    await createAndApply();
    expect(await notifications.fetchUnreadNotificationCount()).toBe(1);
    server.use(
      http.get('/api/v1/notifications', () =>
        HttpResponse.json({ message: '서버 오류' }, { status: 500 }),
      ),
    );
    await expect(notifications.markAllNotificationsRead()).rejects.toThrow('서버 오류');
    expect(await notifications.fetchUnreadNotificationCount()).toBe(1);
    server.resetHandlers();
    expect(await notifications.markAllNotificationsRead()).toBe(0);
    expect(await notifications.fetchUnreadNotificationCount()).toBe(0);
  });
});
