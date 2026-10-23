import { INITIAL_MEMBERS } from '../../../mocks/fixtures';

describe('프로필·프로젝트·팀원 탐색', () => {
  it('프로필 변경값이 있을 때만 저장하고 새로고침 후에도 반영된다', () => {
    cy.visitMock('/profile', { memberId: 1 });
    cy.get('[data-cy=profile-action-button]').first().click();
    cy.get('[data-cy=profile-save-button]').should('be.disabled');
    cy.get('[data-cy=profile-introduction-input]').clear().type('Cypress로 저장한 자기소개입니다.');
    cy.get('[data-cy=profile-save-button]').click();
    cy.contains('[role=status]', '프로필을 저장').should('be.visible');
    cy.reload();
    cy.contains('Cypress로 저장한 자기소개입니다.').should('be.visible');
  });

  it('저장 실패 후 편집 내용을 유지한다', () => {
    cy.visitMock('/profile', {
      memberId: 1,
      members: INITIAL_MEMBERS.map((member) =>
        member.memberId === 1 ? { ...member, name: '저장실패' } : member,
      ),
    });
    cy.get('[data-cy=profile-action-button]').first().click();
    cy.get('[data-cy=profile-introduction-input]').clear().type('실패해도 유지해야 하는 내용');
    cy.get('[data-cy=profile-save-button]').click();
    cy.contains('[role=status]', '서버 오류').should('be.visible');
    cy.get('[data-cy=profile-introduction-input]').should(
      'have.value',
      '실패해도 유지해야 하는 내용',
    );
  });

  it('공개 프로필에서는 수정 버튼과 이메일을 노출하지 않는다', () => {
    cy.visitMock('/profile/2', { memberId: 1 });
    cy.contains('이준호').should('be.visible');
    cy.contains('button', '프로필 수정').should('not.exist');
    cy.contains('junho@example.com').should('not.exist');
  });

  it('프로젝트 검색의 빈 결과·오류·재시도와 필터 초기화', () => {
    cy.visitMock('/projects');
    cy.get('[data-cy=project-card]').should('have.length.at.least', 1);
    cy.get('[data-cy=project-search-input]').type('존재하지않는프로젝트');
    cy.get('[data-cy=project-empty-state]').should('be.visible');
    cy.get('[data-cy=project-search-input]').clear().type('조회실패');
    cy.get('[data-cy=project-error-state]').should('be.visible');
    cy.get('[data-cy=project-retry-button]').click();
    cy.get('[data-cy=project-error-state]').should('be.visible');
    cy.get('[data-cy=project-search-input]').clear().type('캠퍼스');
    cy.get('[data-cy=project-card-title]').first().should('contain', '캠퍼스');
  });

  it('모바일에서 팀원을 검색하고 공개 프로필로 이동한다', () => {
    cy.viewport(390, 844);
    cy.visitMock('/teammates');
    cy.get('[data-cy=teammate-search-input]').type('김민지');
    cy.get('[data-cy=teammate-card-name]').should('contain', '김민지');
    cy.document().then((document) =>
      expect(document.documentElement.scrollWidth).to.be.at.most(390),
    );
    cy.get('[data-cy=teammate-card]').first().click();
    cy.location('pathname').should('eq', '/profile/1');
  });
});
