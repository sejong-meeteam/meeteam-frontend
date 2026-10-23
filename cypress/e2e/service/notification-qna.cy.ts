describe('알림과 Q&A', () => {
  it('SSE 새 알림 수신 → 서버 읽음 처리 → 새로고침 후 유지', () => {
    cy.visitMock('/notifications', { memberId: 1 });
    cy.contains('도착한 알림이 없습니다.').should('be.visible');
    cy.window().then((win) => {
      win.localStorage.setItem(
        'meeteam-notifications',
        JSON.stringify([
          {
            id: 11,
            receiverId: 1,
            type: 'PROJECT_APPLY',
            isRead: false,
            createdAt: new Date().toISOString(),
            payload: { projectId: 101, projectName: '캠퍼스 메이커스', applicantName: '이준호' },
          },
        ]),
      );
    });
    cy.contains('새로운 지원자가 있습니다.').should('be.visible');
    cy.contains('1개의 안 읽은 알림').should('be.visible');
    cy.contains('button', '모두 읽음 처리').click();
    cy.contains('0개의 안 읽은 알림').should('be.visible');
    cy.reload();
    cy.contains('0개의 안 읽은 알림').should('be.visible');
    cy.contains('a', '지원자 확인').click();
    cy.location('pathname').should('eq', '/projects/101/manage/applicants');
  });

  it('비밀 질문과 리더 답변을 작성하고 공개 범위를 검증한다', () => {
    cy.visitMock('/projects/102', { memberId: 1 });
    cy.get('[data-cy=project-detail-tab-qna]').click();
    cy.get('textarea[placeholder="프로젝트에 대해 궁금한 점을 남겨주세요."]').type(
      '비밀 회의 장소를 알려주세요.',
    );
    cy.contains('label', '비밀글').click();
    cy.contains('button', '등록').click();
    cy.contains('비밀 회의 장소를 알려주세요.').should('be.visible');
    cy.window().then((win) => win.localStorage.setItem('meeteam-week4-session', '2'));
    cy.reload();
    cy.get('[data-cy=project-detail-tab-qna]').click();
    cy.contains('article', '비밀 회의 장소').within(() =>
      cy.contains('button', '답변하기').click(),
    );
    cy.get('textarea[placeholder="답변을 입력해 주세요."]').type('회의 장소는 온라인입니다.');
    cy.contains('button', '답변 등록').click();
    cy.contains('회의 장소는 온라인입니다.').should('be.visible');
    cy.window().then((win) => win.localStorage.removeItem('meeteam-week4-session'));
    cy.reload();
    cy.get('[data-cy=project-detail-tab-qna]').click();
    cy.contains('비밀글입니다.').should('be.visible');
    cy.contains('회의 장소는 온라인입니다.').should('not.exist');
    cy.contains('비밀 회의 장소를 알려주세요.').should('not.exist');
  });
});
