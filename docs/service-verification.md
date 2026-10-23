# 프로젝트 관리·알림·Q&A 검증

## 기준과 범위

프론트 `0.3.0`의 개선 사항과 검증 범위입니다. 백엔드 계약은 `sejong-meeteam/meeteam-backend`의 `c932118942d9a09c8b4e8e3383ff9ad82fde4325`를 읽어 확인했습니다. 운영 중인 서버의 배포 버전과 같다는 보장은 없습니다.

실제 서버는 사용자 요청에 따라 켜지 않으며 이 작업에서는 실서버 요청·데이터 변경을 수행하지 않습니다. Vitest 통합 테스트는 MSW 기반 API·상태 흐름 검증이며, 이후 추가한 Cypress는 동일한 모의 API를 사용하는 브라우저 E2E입니다. 어느 쪽도 실서버 성공 증명이 아닙니다.

## 확인한 API 정책

### 알림 읽음

백엔드는 `GET /api/v1/notifications` 조회 시 해당 회원의 **모든 페이지 알림을 읽음 처리**합니다. 별도의 읽음 변경 API는 없습니다. 조회 응답은 변경 전 읽음 값을 포함할 수 있습니다.

프론트의 전체 읽음 버튼은 목록 API를 호출한 다음 `/api/v1/notifications/unread/count`를 조회합니다. 성공한 뒤에만 화면을 읽음으로 바꾸고 실제 서버 개수를 헤더에 반영합니다. 실패하면 기존 화면과 개수를 유지하고 오류를 표시합니다. 목록 조회에 따른 서버 읽음 정책 때문에 개별 알림만 읽음으로 변경하는 기능은 제공하지 않습니다.

근거: [NotificationService](https://github.com/sejong-meeteam/meeteam-backend/blob/c932118942d9a09c8b4e8e3383ff9ad82fde4325/src/main/java/com/wardk/meeteam_backend/domain/notification/service/NotificationService.java), [NotificationController](https://github.com/sejong-meeteam/meeteam-backend/blob/c932118942d9a09c8b4e8e3383ff9ad82fde4325/src/main/java/com/wardk/meeteam_backend/web/notification/controller/NotificationController.java).

### 실시간 알림

네이티브 EventSource 대신 인증 요청 모듈을 사용하는 fetch 스트림으로 `/api/v1/subscribe`에 연결합니다. Authorization·쿠키와 재연결 시 Last-Event-ID를 전달합니다. 연결이 종료되면 1~30초 간격으로 재시도하고 로그아웃·컴포넌트 정리 시 요청과 타이머를 취소합니다.

UTF-8 청크, CR/LF 줄 구분, 다중 data 줄, heartbeat를 처리하며 같은 이벤트 ID의 재전송은 미확인 개수를 중복 증가시키지 않습니다. 최근 1,000개 ID를 메모리에 보관합니다. 실제 프록시·Vercel의 연결 제한과 장시간 수신은 서버가 실행될 때 별도 확인해야 합니다.

### 모집 상태

수동 변경 API는 `POST /api/v1/projects/{id}/recruitment/toggle`이며 `RECRUITING ↔ SUSPENDED`만 전환합니다. `CLOSED`는 전체 포지션 마감에 따른 서버 자동 상태입니다. 프론트에서 완료 상태를 임의로 저장하거나 없는 API를 호출하지 않습니다.

승인·거절 후 지원자 목록과 관리 헤더를 다시 조회합니다. 방출 후 팀원 목록과 헤더, 탈퇴 후 프로젝트 상세와 모집 정보를 다시 가져옵니다. 탈퇴는 성공했지만 재조회가 실패한 경우 이를 구분해서 안내합니다.

근거: [ProjectManagementController](https://github.com/sejong-meeteam/meeteam-backend/blob/c932118942d9a09c8b4e8e3383ff9ad82fde4325/src/main/java/com/wardk/meeteam_backend/web/project/controller/ProjectManagementController.java), [Recruitment](https://github.com/sejong-meeteam/meeteam-backend/blob/c932118942d9a09c8b4e8e3383ff9ad82fde4325/src/main/java/com/wardk/meeteam_backend/domain/project/entity/Recruitment.java).

### 비밀 Q&A

질문 작성자와 프로젝트 리더만 비밀 질문·답변을 보고 답변할 수 있습니다. 공개 질문은 누구나 조회할 수 있지만 답변 권한은 동일하게 제한합니다. 서버의 마스킹과 권한 검사가 보안 경계이며 프론트 가림 처리는 추가 보호입니다. 인증 사용자가 바뀌면 다시 조회하고 이전 답변 초안을 지웁니다.

근거: [ProjectQnaService](https://github.com/sejong-meeteam/meeteam-backend/blob/c932118942d9a09c8b4e8e3383ff9ad82fde4325/src/main/java/com/wardk/meeteam_backend/domain/qna/service/ProjectQnaService.java).

## 자동 검증

```bash
npm run test:unit
npm run test:service
npm run test:regression
npm run test:types
npm run test:e2e
npm run test:stories
```

`test:service`는 `test:unit`에 포함되므로 두 명령 결과의 테스트 수를 중복 합산하지 않습니다.

2026-10-16 릴리스 기준: Vitest 91개, 지원 흐름 회귀 13개 통과.

2026-10-23 `0.3.1` 배포 준비 코드 기준: Vitest 95개, 지원 흐름 회귀 13개, MSW 브라우저 E2E 18개, Storybook 상호작용·접근성 10개가 통과했습니다. 앱·Cypress 타입 검사가 통과했으며 ESLint는 오류 0개·기존 경고 4개입니다. 로컬 서비스 프로덕션 빌드는 실행하지 않았습니다. 실행 조건과 접근성 검사 대상은 [테스트 문서](testing.md)를 참고합니다.

| 흐름                | 자동 검증 내용                                                               |
| ------------------- | ---------------------------------------------------------------------------- |
| 로그인·프로필       | 모의 로그인 → 프로필 저장·재조회 → 로그아웃                                  |
| 등록·탐색·수정      | 등록 → 수정 화면 원본 조회 → 수정·상세·검색 반영                             |
| 모집·지원·승인      | 중단·재개 → 지원 → 리더 지원서 상세 → 승인 → 팀원·지원 상태·자동 마감 재조회 |
| 거절·방출·탈퇴·삭제 | 결정 후 재처리 차단, 팀원 인원·목록 갱신, 리더 방출·비리더 변경 거절         |
| 알림                | 생성·목록·읽음 영속성, 서버 실패 후 재시도, 헤더 인증·이벤트 중복 처리       |
| Q&A                 | 비밀 질문·답변 생성·재조회, 작성자·리더 공개와 비회원 마스킹, 공백 입력 거절 |
| 프록시              | SSE 헤더·본문 전달, 다른 Origin 거절, 네트워크 실패 502                      |

## 실서버에서 남은 점검

- 실제 세종대 계정으로 로그인·새로고침·토큰 갱신·로그아웃을 확인합니다.
- 일반 회원·지원자·팀원·리더 계정으로 관리 권한과 승인 후 데이터 영속성을 확인합니다.
- 두 브라우저에서 지원·승인 알림의 실시간 수신, 읽음 개수와 재접속을 확인합니다.
- 비밀 Q&A는 브라우저에 표시된 내용뿐 아니라 API 응답에서도 비인가 사용자에게 가려지는지 확인합니다.
- 도메인은 프론트 `https://www.meeteam.fignal.me`, API `https://meeteam.fignal.me`입니다. `.site` 주소는 이 설정에 사용하지 않습니다.
- AWS 리소스·DNS·인증서·DB·Redis 운영 상태는 프론트 테스트로 확인하지 않았습니다. Vercel 프론트 배포와 별도로 운영자가 확인해야 합니다.

따라서 보고서에는 **기능 구현 및 MSW 기반 통합·브라우저 검증**과 **실서버 통합 검증 미실시**를 구분합니다. 실제 API 사용자 흐름까지 검증 완료 또는 전체 목표 100% 달성으로 기재하지 않습니다.
