function fillProject(name: string, withImage = false) {
  cy.visitMock('/projects/create', { memberId: 1 });
  cy.contains('button', '다음').click();
  cy.get('[role=alert]').should('exist');
  cy.get('[data-cy=project-form-name]').type(name);
  cy.get('[data-cy=project-form-category-capstone]').click();
  if (withImage) {
    cy.get('input[type=file]').first().selectFile('public/brand/meeteam-logo.png', { force: true });
    cy.get('[role=dialog]').contains('button', '적용하기').click();
    cy.get('[role=dialog]').should('not.exist');
  }
  cy.contains('button', '다음').click();
  cy.get('[data-cy=project-form-description]').type(
    '함께 캠퍼스의 문제를 해결하는 웹 서비스를 개발합니다.',
  );
  cy.contains('button', '다음').click();
  cy.get('[data-cy=project-form-my-major]').click();
  cy.contains('ul button', /프론트/).click();
  cy.get('[data-cy=project-form-my-minor]').click();
  cy.contains('ul button', '웹 프론트엔드').click();
  cy.get('[data-cy=project-form-recruit-major-0]').click();
  cy.contains('ul button', /프론트/).click();
  cy.get('[data-cy=project-form-recruit-minor-0]').click();
  cy.contains('ul button', '웹 프론트엔드').click();
  cy.contains('button', '다음').click();
  cy.get('[data-cy=project-form-tech-input-0]').type('React{enter}');
  cy.get('[data-cy=project-form-until-complete]').check({ force: true });
}

describe('프로젝트 단계별 등록 및 수정', () => {
  it('필수값 검증·이미지 조정·단계 이동·등록·상세 이동을 검증한다', () => {
    fillProject('브라우저에서 등록한 프로젝트', true);
    cy.get('[data-cy=project-form-submit]').click();
    cy.location('pathname').should('match', /^\/projects\/\d+$/);
    cy.contains('브라우저에서 등록한 프로젝트').should('be.visible');
  });

  for (const name of ['등록실패', '네트워크오류']) {
    it(`${name}: 실패 시 입력 내용을 보존하고 중복 제출 잠금을 해제한다`, () => {
      fillProject(name);
      cy.get('[data-cy=project-form-submit]').click();
      cy.get('[role=status]').should('be.visible');
      cy.location('pathname').should('eq', '/projects/create');
      cy.get('[data-cy=project-form-submit]').should('be.enabled');
      cy.contains('button', '이전').click();
      cy.contains('button', '이전').click();
      cy.contains('button', '이전').click();
      cy.get('[data-cy=project-form-name]').should('have.value', name);
    });
  }

  it('기존 프로젝트 이름을 수정하고 관리·상세 화면에서 재조회한다', () => {
    cy.visitMock('/projects/101/manage/edit', { memberId: 1 });
    cy.get('[data-cy=project-form-name]')
      .should('have.value', '캠퍼스 메이커스')
      .clear()
      .type('수정된 캠퍼스 프로젝트');
    cy.get('[data-cy=project-form-submit]').click();
    cy.location('pathname').should('eq', '/projects/101/manage');
    cy.get('[data-cy=project-manage-title-link]')
      .should('contain', '수정된 캠퍼스 프로젝트')
      .click();
    cy.contains('수정된 캠퍼스 프로젝트').should('be.visible');
  });
});
