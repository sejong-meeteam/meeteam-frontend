function story(id: string) {
  cy.visit(`http://127.0.0.1:6006/iframe.html?id=${id}&viewMode=story`);
  cy.get('#storybook-root').should('not.be.empty');
  cy.document().should((document) =>
    expect(
      document
        .defaultView!.getComputedStyle(document.documentElement)
        .getPropertyValue('--mt-primary')
        .trim(),
    ).not.to.eq(''),
  );
}

describe('Storybook 공통 UI의 실제 브라우저 상호작용', () => {
  it('모달 이름·초기 포커스·Tab 순환·Escape·포커스 복귀', () => {
    story('shared-feedback--confirmation');
    cy.contains('button', '삭제 확인 열기').click();
    cy.get('[role=dialog]').should('have.attr', 'aria-labelledby');
    cy.focused().should('contain', '닫기');
    cy.focused().trigger('keydown', { key: 'Tab', shiftKey: true });
    cy.focused().should('contain', '삭제하기');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.focused().should('contain', '닫기');
    cy.press(Cypress.Keyboard.Keys.ESC);
    cy.get('[role=dialog]').should('not.exist');
    cy.focused().should('contain', '삭제 확인 열기');
  });

  it('확인 동작과 제출 중 중복 작업·닫기 방지', () => {
    story('shared-feedback--confirmation');
    cy.contains('button', '삭제 확인 열기').click();
    cy.contains('button', '삭제하기').click();
    cy.contains('[role=status]', '삭제가 완료되었습니다.').should('be.visible');
    story('shared-feedback--submitting');
    cy.contains('button', '삭제 확인 열기').click();
    cy.get('[role=dialog] button').should('be.disabled');
    cy.press(Cypress.Keyboard.Keys.ESC);
    cy.get('[role=dialog]').should('be.visible');
  });

  it('드롭다운 선택 항목이 키보드로 동작하고 Escape 후 포커스를 돌려준다', () => {
    story('shared-form--dropdown');
    cy.contains('button', '직군을 선택하세요').click().should('have.attr', 'aria-expanded', 'true');
    cy.contains('button', '백엔드').focus();
    cy.focused().type('{enter}');
    cy.focused().should('contain', '백엔드').and('have.attr', 'aria-expanded', 'false');
    cy.focused().click();
    cy.press(Cypress.Keyboard.Keys.ESC);
    cy.focused().should('contain', '백엔드').and('have.attr', 'aria-expanded', 'false');
  });

  it('오류 입력의 레이블·설명·invalid 상태와 비활성 버튼', () => {
    story('shared-form--error-state');
    cy.get('#storybook-error').should('have.attr', 'aria-invalid', 'true');
    cy.get('[role=alert]').should('contain', '필수 항목');
    story('shared-button--disabled');
    cy.contains('button', '비활성 버튼').should('be.disabled');
  });

  it('토스트를 지정 시간 후 정리하고 수동으로도 닫을 수 있다', () => {
    story('shared-feedback--toast');
    cy.clock();
    cy.contains('button', '성공').click();
    cy.contains('[role=status]', '성공 안내 예시입니다.').should('be.visible');
    cy.tick(4200);
    cy.get('[role=status]').should('not.exist');
    cy.contains('button', '오류').click();
    cy.contains('[role=status]', '오류 안내 예시입니다.').should('be.visible');
    cy.get('button[aria-label="알림 닫기"]').click();
    cy.get('[role=status]').should('not.exist');
  });

  for (const id of [
    'shared-button--primary',
    'shared-form--text-fields',
    'shared-form--error-state',
    'shared-feedback--confirmation',
    'domain-cards--unread-notification',
  ]) {
    it(`${id}: axe 접근성 검사`, () => {
      story(id);
      if (id.includes('confirmation')) cy.contains('button', '삭제 확인 열기').click();
      cy.injectAxe();
      cy.checkA11y(
        id.includes('confirmation') ? '[role=dialog]' : '#storybook-root',
        { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } },
        (violations) => {
          cy.task(
            'reportA11y',
            violations.map(({ id, nodes }) => ({
              id,
              nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
            })),
          );
        },
      );
    });
  }
});
