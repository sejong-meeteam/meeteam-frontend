import { INITIAL_PROJECTS } from '../../../mocks/fixtures';

const pending = {
  applicationId: 901,
  projectId: 101,
  projectName: '캠퍼스 메이커스',
  projectImageUrl: null,
  applicantId: 2,
  jobPositionId: 1,
  jobPositionName: '웹 프론트엔드',
  status: 'PENDING',
  statusDisplayName: '대기 중',
  motivation: '함께 기능을 구현하고 테스트를 작성하고 싶습니다.',
  appliedAt: new Date().toISOString(),
};

describe('지원·관리·상태 갱신', () => {
  it('지원서 검증 → 제출 → 본인 상세 → 취소 → 새로고침', () => {
    cy.visitMock('/projects/102/apply', { memberId: 1 });
    cy.get('[data-cy=project-application-motivation]').type('짧음');
    cy.get('[data-cy=project-application-submit]').click();
    cy.contains('[role=status]', '10자').should('be.visible');
    cy.get('[data-cy=project-application-motivation]')
      .clear()
      .type('함께 안정적인 서비스를 만들며 성장하고 싶습니다.');
    cy.get('[data-cy=project-application-submit]').click();
    cy.location('pathname').should('match', /^\/projects\/102\/apply\/\d+$/);
    cy.visit('/profile/applications');
    cy.contains('a', '지원서 보기').click();
    cy.get('[data-cy=application-cancel-button]').click();
    cy.get('[role=dialog]').should('be.visible');
    cy.contains('[role=dialog] button', '지원 취소하기').click();
    cy.location('pathname').should('eq', '/profile/applications');
    cy.reload();
    cy.contains('취소').should('be.visible');
  });

  it('승인 이후 대기 목록·팀원·자동 모집 완료가 갱신된다', () => {
    const projects = INITIAL_PROJECTS.map((project) =>
      project.id === 101
        ? { ...project, recruitments: project.recruitments.map((item) => ({ ...item, count: 1 })) }
        : project,
    );
    cy.visitMock('/projects/101/manage/applicants', {
      memberId: 1,
      applications: [pending],
      projects,
    });
    cy.get('[data-cy=project-applicant-approve-901]').click();
    cy.contains('모집 완료').should('be.visible');
    cy.get('[data-cy=project-applicant-approve-901]').should('not.exist');
    cy.contains('a', '팀원 관리').click();
    cy.contains('이준호').should('be.visible');
    cy.contains('button', '방출').click();
    cy.contains('[role=dialog]', '이준호').should('be.visible');
    cy.contains('[role=dialog] button', '방출하기').click();
    cy.get('[role=dialog]').should('not.exist');
    cy.contains('이준호').should('not.exist');
    cy.get('[data-cy=project-manage-status-recruiting]').should('be.checked');
  });

  it('모집 중단·재개와 삭제 확인 입력을 검증한다', () => {
    cy.visitMock('/projects/101/manage', { memberId: 1 });
    cy.get('[data-cy=project-manage-status-suspended]').check({ force: true });
    cy.get('[data-cy=project-manage-status-suspended]').should('be.checked');
    cy.get('[data-cy=project-manage-status-recruiting]').check({ force: true });
    cy.get('[data-cy=project-manage-status-recruiting]').should('be.checked');
    cy.get('[data-cy=project-delete-button]').click();
    cy.get('[data-cy=project-delete-confirm-button]').should('be.disabled');
    cy.get('[data-cy=project-delete-confirm-input]').type('캠퍼스 메이커스');
    cy.get('[data-cy=project-delete-confirm-button]').click();
    cy.location('pathname').should('eq', '/projects');
    cy.get('[data-project-id=101]').should('not.exist');
  });

  it('비리더의 관리 직접 접근을 상세 화면으로 돌려보낸다', () => {
    cy.visitMock('/projects/102/manage', { memberId: 1 });
    cy.location('pathname').should('eq', '/projects/102');
    cy.get('[data-cy=project-delete-button]').should('not.exist');
  });
});
