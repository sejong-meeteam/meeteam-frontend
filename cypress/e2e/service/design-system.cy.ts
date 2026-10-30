describe('디자인 시스템 지연 로딩', () => {
  it('상세 문서를 불러온 뒤에도 속성 앵커와 예시 코드가 동작한다', () => {
    cy.visitMock('/design-system#button--properties');
    cy.get('#button--properties')
      .should('be.visible')
      .then(($section) => {
        expect($section[0].getBoundingClientRect().top).to.be.within(64, 120);
      });
    cy.get('#button-preview-panel select').first().select('gray');
    cy.get('#button-code-tab').click();
    cy.get('#button-code-panel').should('be.visible').and('contain', 'variant="gray"');
  });

  it('파운데이션의 깊은 링크도 지연 로딩 후 해당 섹션으로 이동한다', () => {
    cy.visitMock('/design-system#colors--usage');
    cy.get('#colors--usage')
      .should('be.visible')
      .then(($section) => {
        expect($section[0].getBoundingClientRect().top).to.be.within(64, 120);
      });
    cy.get('h1').should('have.text', 'Color');
  });

  it('모바일에서 지연 로딩한 토스트 예시를 실행할 수 있다', () => {
    cy.viewport(390, 844);
    cy.visitMock('/design-system#toast');
    cy.get('#toast-preview-panel select').first().select('info');
    cy.contains('button', '토스트 띄우기').click();
    cy.contains('[role=status]', '새로운 팀원이 합류했어요.').should('be.visible');
    cy.document().then((document) => {
      expect(document.documentElement.scrollWidth).to.be.at.most(390);
    });
  });
});
