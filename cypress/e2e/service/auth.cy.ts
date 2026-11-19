describe('인증 및 보호 화면', () => {
  it('비회원의 직접 접근에는 로그인 안내가 뜨고 Escape로 닫힌다', () => {
    cy.visitMock('/profile');
    cy.get('[role=dialog]').should('be.visible');
    cy.press(Cypress.Keyboard.Keys.ESC);
    cy.get('[role=dialog]').should('not.exist');
    cy.contains('로그인이 필요').should('be.visible');
  });

  it('잘못된 로그인 후 입력을 유지하고 정상 로그인·새로고침·로그아웃한다', () => {
    cy.visitMock('/auth/login');
    cy.contains('처음이신가요?').should('be.visible');
    cy.get('[data-cy=login-student-id]').type('20260001');
    cy.get('[data-cy=login-password]').type('wrong-password', { log: false });
    cy.get('[data-cy=login-submit]').should('be.enabled').click();
    cy.contains('[role=alert]', '동의해 주세요').should('be.visible');
    cy.focused().should('have.attr', 'data-cy', 'login-consent');
    cy.location('pathname').should('eq', '/auth/login');
    cy.get('[data-cy=login-consent]').check({ force: true });
    cy.contains('[role=alert]', '동의해 주세요').should('not.exist');
    cy.get('[data-cy=login-submit]').click();
    cy.contains('[role=status]', '데모 계정 정보를 확인').should('be.visible');
    cy.get('[data-cy=login-student-id]').should('have.value', '20260001');
    cy.get('[data-cy=login-password]').clear().type('demo1234', { log: false });
    cy.get('[data-cy=login-submit]').click();
    cy.get('[aria-label="프로필 메뉴"]').should('be.visible');
    cy.reload();
    cy.get('[aria-label="프로필 메뉴"]').click();
    cy.contains('button', '로그아웃').click();
    cy.get('[aria-label="프로필 메뉴"]').should('not.exist');
    cy.visit('/profile');
    cy.get('[role=dialog]').should('be.visible');
  });

  it('신규 포털 회원을 세종대 가입 화면으로 연결하고 필수 입력을 검증한다', () => {
    cy.visitMock('/auth/login');
    cy.loginDemo('20260002');
    cy.location('pathname').should('eq', '/auth/sign-up/sejong');
    cy.get('[data-cy=sejong-signup-form]').should('be.visible');
    cy.get('[data-cy=sejong-signup-submit]').click();
    cy.get('[role=alert]').should('exist');
    cy.get('[data-cy=signup-name]').should('not.exist');
    cy.get('[data-cy=signup-verified-name]').should('have.text', '테스트 학생');
    cy.get('[data-cy=signup-verified-department]').should('have.text', '테스트학과');
    cy.location('search').should('eq', '');
    cy.reload();
    cy.get('[data-cy=signup-verified-name]').should('have.text', '테스트 학생');
    cy.get('[data-cy=signup-birth]').type('2002-01-01');
    cy.get('[data-cy=signup-gender-female]').check({ force: true });
    cy.get('[data-cy=signup-interest-major-0]').click();
    cy.contains('ul button', '프론트').click();
    cy.get('[data-cy=signup-interest-minor-0]').click();
    cy.contains('ul button', '웹 프론트엔드').click();
    cy.get('[data-cy=signup-tech-input]').type('React{enter}');
    cy.get('[data-cy=sejong-signup-submit]').click();
    cy.get('[aria-label="프로필 메뉴"]').should('be.visible');
    cy.visit('/profile');
    cy.contains('h1', '테스트 학생').should('be.visible');
    cy.contains('테스트학과').should('be.visible');
  });

  it('학교 확인 정보가 없거나 가입 코드가 만료되면 다시 로그인을 안내한다', () => {
    cy.visitMock('/auth/sign-up/sejong');
    cy.contains('세종대 포털로 다시 로그인').should('be.visible');
    cy.contains('a', '로그인으로 돌아가기').click();
    cy.loginDemo('20260002');
    cy.get('[data-cy=signup-verified-name]').should('be.visible');

    cy.window().then((window) => {
      const key = 'meeteam-sejong-onboarding';
      const pending = JSON.parse(window.sessionStorage.getItem(key)!);
      window.sessionStorage.setItem(key, JSON.stringify({ ...pending, expiresAt: Date.now() - 1 }));
    });
    cy.reload();
    cy.contains('세종대 포털로 다시 로그인').should('be.visible');
    cy.get('[data-cy=sejong-signup-form]').should('not.exist');
    cy.window()
      .its('sessionStorage')
      .invoke('getItem', 'meeteam-sejong-onboarding')
      .should('be.null');
  });
});
