describe('서비스와 함께 배포한 Storybook 정적 파일', () => {
  beforeEach(() => {
    cy.intercept({ pathname: '/vite-inject-mocker-entry.js' }, () => {
      throw new Error('Storybook 런타임을 /storybook 하위 경로에서 불러와야 합니다.');
    });
    cy.intercept('**/api/**', () => {
      throw new Error('정적 Storybook은 실제 API를 호출하지 않아야 합니다.');
    });
  });

  it('진입 경로를 정적 index로 연결하고 스토리 목록·미리보기를 불러온다', () => {
    cy.visit('http://127.0.0.1:3005/storybook?path=/story/shared-button--primary');
    cy.location('pathname').should('eq', '/storybook/index.html');
    cy.get('#storybook-preview-iframe').should('be.visible');
    cy.request('index.json').its('body.entries').should('have.property', 'shared-button--primary');
    cy.request('vite-inject-mocker-entry.js').its('status').should('eq', 200);
    cy.request('iframe.html').its('body').should('contain', 'src="./vite-inject-mocker-entry.js"');
    cy.get('#storybook-preview-iframe')
      .its('0.contentDocument.body')
      .should('contain', '기본 버튼');
    cy.reload();
    cy.get('#storybook-preview-iframe')
      .its('0.contentDocument.body')
      .should('contain', '기본 버튼');
  });

  for (const id of [
    'foundation--brand',
    'domain-cards--recruiting-project',
    'domain-cards--full-project',
  ]) {
    it(`${id}: 하위 경로에서 스타일·이미지를 정상 표시한다`, () => {
      cy.visit(`iframe.html?id=${id}&viewMode=story`);
      cy.get('#storybook-root').should('not.be.empty');
      cy.get('#storybook-root img').should(($images) => {
        expect($images.length).to.be.greaterThan(0);
        for (const image of $images.toArray() as HTMLImageElement[]) {
          expect(image.complete, image.src).to.eq(true);
          expect(image.naturalWidth, image.src).to.be.greaterThan(0);
        }
      });
      cy.document().should((document) => {
        expect(
          document
            .defaultView!.getComputedStyle(document.documentElement)
            .getPropertyValue('--mt-primary')
            .trim(),
        ).not.to.eq('');
      });
    });
  }
});
