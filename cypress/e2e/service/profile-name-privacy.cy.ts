import { INITIAL_MEMBERS } from '../../../mocks/fixtures';

const edit = '[data-cy=profile-action-button]';
const toggle = '[data-cy=profile-name-private-toggle]';
const save = '[data-cy=profile-save-button]';

describe('프로필 이름 비공개', () => {
  it('학교 확인 이름은 읽기 전용이며, 토글만 바꿔도 저장되고 공개 프로필이 갱신된다', () => {
    cy.visitMock('/profile', { memberId: 1 });
    cy.get(edit).click();
    cy.get('[data-cy=profile-verified-name]').should(($name) => {
      expect($name).to.have.prop('readOnly', true);
      expect($name).to.have.value('김민지');
    });
    cy.get(toggle).should('have.attr', 'aria-checked', 'false');
    cy.get(toggle).click();
    cy.get(save).should('be.enabled').click();
    cy.contains('[role=status]', '프로필을 저장했습니다.').should('be.visible');
    cy.visit('/profile/1');
    cy.contains('h1', '김**').should('be.visible');
    cy.contains('h1', '김민지').should('not.exist');

    cy.visit('/profile');
    cy.get(edit).click();
    cy.get(toggle).should('have.attr', 'aria-checked', 'true');
    cy.get(toggle).click();
    cy.contains('button', '취소').click();
    cy.get(edit).click();
    cy.get(toggle).should('have.attr', 'aria-checked', 'true');
    cy.get(toggle).click();
    cy.get(save).click();
    cy.get(edit).should('be.visible');
    cy.visit('/profile/1');
    cy.contains('h1', '김민지').should('be.visible');
  });

  it('리더 지원자 화면의 실명은 공개 프로필과 분리되고 로그아웃 후 사라진다', () => {
    const members = INITIAL_MEMBERS.map((member) =>
      member.memberId === 2 ? { ...member, namePrivate: true } : member,
    );
    cy.visitMock('/projects/101/manage/applicants', {
      memberId: 1,
      members,
      applications: [
        {
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
        },
      ],
    });
    cy.contains('이준호').should('be.visible');
    cy.contains('button', '상세 보기').click();
    cy.contains('[role=dialog] h2', '이준호').should('be.visible');
    cy.get('[role=dialog]').type('{esc}');
    cy.get('button[aria-label="프로필 메뉴"]').click();
    cy.contains('[role=menuitem]', '로그아웃').click();
    cy.location('pathname').should('eq', '/');
    cy.contains('이준호').should('not.exist');
    cy.visit('/profile/2');
    cy.contains('h1', '이**').should('be.visible');
    cy.contains('이준호').should('not.exist');
  });
});
