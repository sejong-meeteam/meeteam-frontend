import 'cypress-axe';
import { INITIAL_PROJECTS, INITIAL_MEMBERS } from '../../mocks/fixtures';

type Seed = {
  memberId?: number;
  members?: typeof INITIAL_MEMBERS;
  applications?: unknown[];
  projects?: typeof INITIAL_PROJECTS;
  notifications?: unknown[];
};
declare global {
  // Cypress custom commands extend the library's global namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      visitMock(path: string, seed?: Seed): Chainable<AUTWindow>;
      loginDemo(studentId?: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('visitMock', (path, seed = {}) => {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.clear();
      win.sessionStorage.clear();
      win.localStorage.setItem(
        'meeteam-week4-members',
        JSON.stringify(seed.members ?? INITIAL_MEMBERS),
      );
      win.localStorage.setItem(
        'meeteam-week5-projects',
        JSON.stringify(seed.projects ?? INITIAL_PROJECTS),
      );
      if (seed.memberId) win.localStorage.setItem('meeteam-week4-session', String(seed.memberId));
      if (seed.applications)
        win.localStorage.setItem('meeteam-week6-applications', JSON.stringify(seed.applications));
      if (seed.notifications)
        win.localStorage.setItem('meeteam-notifications', JSON.stringify(seed.notifications));
    },
  });
  cy.contains('데모 데이터를 준비하고 있습니다...').should('not.exist');
});

Cypress.Commands.add('loginDemo', (studentId = '20260001') => {
  cy.get('[data-cy=login-student-id]').type(studentId);
  cy.get('[data-cy=login-password]').type('demo1234', { log: false });
  cy.get('[data-cy=login-consent]').check({ force: true });
  cy.get('[data-cy=login-submit]').click();
});

beforeEach(() => {
  // These domains must never receive browser E2E traffic, even if configuration regresses.
  cy.intercept({ hostname: /(^|\.)(fignal\.me|trycloudflare\.com|alom-sejong\.com)$/ }, () => {
    throw new Error('실제 API 요청이 차단되었습니다. MSW 설정을 확인하세요.');
  });
});
