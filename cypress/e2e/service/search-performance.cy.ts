import { INITIAL_PROJECTS } from '../../../mocks/fixtures';

const PROJECTS = Array.from({ length: 20 }, (_, index) => ({
  ...INITIAL_PROJECTS[0],
  id: 2000 + index,
  name: `페이지 검증 프로젝트 ${index + 1}`,
  createdAt: new Date(Date.UTC(2026, 9, 30, 0, index)).toISOString(),
}));

function cardIds() {
  return cy
    .get('[data-cy=project-card]')
    .then(($cards) => [...$cards].map((card) => card.getAttribute('href')));
}

describe('검색 요청과 페이지네이션 회귀', () => {
  it('프로젝트를 추가 조회해도 카드 중복이나 누락이 없다', () => {
    cy.visitMock('/projects', { projects: PROJECTS });
    cy.get('[data-cy=project-card]').should('have.length', 8);
    cy.get('[data-cy=project-load-more-trigger]').scrollIntoView();
    cy.get('[data-cy=project-card]').should('have.length', 16);
    cardIds().then((ids) => expect(new Set(ids).size).to.eq(16));
    cy.get('[data-cy=project-load-more-trigger]').scrollIntoView();
    cy.get('[data-cy=project-card]').should('have.length', 20);
    cardIds().then((ids) => expect(new Set(ids).size).to.eq(20));
    cy.get('[data-cy=project-load-more-trigger]').should('not.exist');
  });

  it('추가 조회 도중 검색어를 바꿔도 이전 목록이 섞이지 않는다', () => {
    cy.visitMock('/projects', { projects: PROJECTS });
    cy.get('[data-cy=project-card]').should('have.length', 8);
    cy.get('[data-cy=project-load-more-trigger]').scrollIntoView();
    cy.get('[data-cy=project-search-input]').type('존재하지않는프로젝트', { delay: 0 });
    cy.get('[data-cy=project-empty-state]').should('be.visible');
    cy.get('[data-cy=project-card]').should('not.exist');
    cy.get('[data-cy=project-search-input]').clear();
    cy.get('[data-cy=project-card]').should('have.length', 8);
    cardIds().then((ids) => expect(new Set(ids).size).to.eq(8));
  });

  it('연속 입력 중간값은 서버에 전송하지 않는다', () => {
    const keywords: string[] = [];
    cy.on('window:before:load', (win) => {
      const originalFetch = win.fetch.bind(win);
      win.fetch = (input, init) => {
        const url = new URL(
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
          win.location.origin,
        );
        if (url.pathname === '/api/v1/projects/search' && url.searchParams.has('keyword')) {
          keywords.push(url.searchParams.get('keyword')!);
        }
        return originalFetch(input, init);
      };
    });
    cy.visitMock('/projects', { projects: PROJECTS });
    cy.get('[data-cy=project-card]').should('have.length', 8);
    cy.get('[data-cy=project-search-input]').type('존재하지않는프로젝트', { delay: 0 });
    cy.get('[data-cy=project-empty-state]')
      .should('be.visible')
      .then(() => {
        expect(keywords).to.deep.eq(['존재하지않는프로젝트']);
      });
  });

  it('빠른 연속 입력은 검색이 끝난 값으로 결과를 갱신한다', () => {
    cy.visitMock('/teammates');
    cy.get('[data-cy=teammate-card]').should('have.length.at.least', 1);
    cy.get('[data-cy=teammate-search-input]').type('김민지', { delay: 0 });
    cy.get('[data-cy=teammate-card-name]').should('have.length', 1).and('contain', '김민지');
    cy.get('[data-cy=teammate-search-input]').clear().type('이준호', { delay: 0 });
    cy.get('[data-cy=teammate-card-name]').should('have.length', 1).and('contain', '이준호');
  });
});
