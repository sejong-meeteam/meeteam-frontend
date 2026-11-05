# 통합 관리자 페이지 기획

운영자가 사용자와 프로젝트를 한 곳에서 조회하고 제재·정리하는 관리자 화면입니다. 프론트에서 MSW로 먼저 전체 동작을 구현하고, 이 문서의 API 계약을 백엔드 요구사항으로 전달합니다.

## 범위

| 구분      | MVP                                                                              | 2차                      |
| --------- | -------------------------------------------------------------------------------- | ------------------------ |
| 대시보드  | 핵심 지표, 최근 가입 회원·생성 프로젝트·관리자 조치                              | 기간별 추이 차트         |
| 사용자    | 목록·검색·필터·정렬, 상세, 정지/해제, 권한 변경, 강제 탈퇴                       | 일괄 처리, CSV 내보내기  |
| 프로젝트  | 목록·검색·필터·정렬, 상세, 숨김/복구, 삭제(soft), 모집 강제 마감, 팀원 강제 제외 | 리더 강제 위임, Q&A 관리 |
| 감사 로그 | 관리자 조치 이력 조회·필터                                                       | 기간 필터                |
| 신고      | -                                                                                | 신고 기능 별도 기획      |

## 결정 사항

| 항목                        | 결정                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------- |
| 권한 단계                   | `ADMIN` 단일 권한. 세분화는 2차                                                       |
| 삭제 방식                   | soft delete(`visibility: DELETED`). 관리자는 복구 가능                                |
| 정지 회원이 리더인 프로젝트 | 자동 처리하지 않음. 관리자가 프로젝트 상세에서 직접 판단                              |
| 강제 탈퇴                   | 노출 중(`VISIBLE`)인 프로젝트의 리더면 거부. 프로젝트를 먼저 숨김·삭제해야 함         |
| 학번 노출                   | 목록 응답은 서버에서 마스킹(`2026****`), 상세 응답만 전체 학번                        |
| 모집 상태와 노출 상태       | 분리. `recruitmentStatus`(리더 운영)와 `visibility`(관리자 운영)는 서로 덮어쓰지 않음 |
| 조치 사유                   | 모든 변경 조치에 사유 필수(5~200자). 감사 로그에 기록                                 |
| 디자인                      | 별도 시안 없이 기존 디자인 토큰·공통 컴포넌트로 구성                                  |

## 권한 모델

- `GET /api/v1/members/me` 응답에 `role: 'USER' | 'ADMIN'`을 추가합니다. 세션 스토어에 `role`을 보관합니다.
- `/admin/**`는 로그인 필요 경로이며 `RequireAdmin`이 `ADMIN`이 아니면 403 화면을 표시합니다.
- 프론트 가드는 UX 용도입니다. 백엔드는 모든 `/api/v1/admin/*` 요청에서 권한을 검사해야 합니다.
- 관리자 메뉴는 프로필 메뉴에 `ADMIN`에게만 표시합니다.

## 화면

| 경로                          | 화면                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| `/admin`                      | 대시보드: KPI 카드, 최근 가입 회원, 최근 생성 프로젝트, 최근 관리자 조치                        |
| `/admin/users`                | 사용자 목록: 이름·이메일·학번 검색, 상태·권한·직군 필터, 정렬, 페이지네이션(URL 동기화)         |
| `/admin/users/[memberId]`     | 사용자 상세: 기본 정보, 참여 프로젝트, 지원 내역, 조치 이력, 정지/해제·권한 변경·강제 탈퇴      |
| `/admin/projects`             | 프로젝트 목록: 프로젝트명·리더 검색, 카테고리·모집 상태·노출 상태 필터, 정렬                    |
| `/admin/projects/[projectId]` | 프로젝트 상세: 소개, 모집 현황, 팀원(강제 제외), 지원 현황, 조치 이력, 숨김/복구·삭제·강제 마감 |
| `/admin/audit-logs`           | 감사 로그: 조치·대상 유형 필터                                                                  |

## 데이터 타입

`types/admin.ts`를 기준으로 합니다.

```ts
type MemberRole = 'USER' | 'ADMIN';
type MemberStatus = 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';
type ProjectVisibility = 'VISIBLE' | 'HIDDEN' | 'DELETED';
type RecruitmentStatus = 'RECRUITING' | 'CLOSED' | 'SUSPENDED';

type AuditAction =
  | 'MEMBER_SUSPEND'
  | 'MEMBER_UNSUSPEND'
  | 'MEMBER_ROLE_CHANGE'
  | 'MEMBER_WITHDRAW'
  | 'PROJECT_HIDE'
  | 'PROJECT_RESTORE'
  | 'PROJECT_DELETE'
  | 'PROJECT_FORCE_CLOSE'
  | 'PROJECT_MEMBER_EXPEL';
```

## API 계약

- 기본 경로는 `/api/v1/admin`이며 기존 프록시를 그대로 사용합니다.
- 응답은 `{ code, message, result }` 형식입니다.
- 목록은 `{ content, number, size, numberOfElements, totalElements, first, last, empty }` 형식이며 `page`는 0부터 시작합니다.

### 조회

| Method | Path                   | Query                                                                | 결과                        |
| ------ | ---------------------- | -------------------------------------------------------------------- | --------------------------- |
| GET    | `/admin/dashboard`     | -                                                                    | `AdminDashboard`            |
| GET    | `/admin/members`       | `keyword, status, role, jobFieldCode, sort, page, size`              | `Page<AdminMemberSummary>`  |
| GET    | `/admin/members/{id}`  | -                                                                    | `AdminMemberDetail`         |
| GET    | `/admin/projects`      | `keyword, category, recruitmentStatus, visibility, sort, page, size` | `Page<AdminProjectSummary>` |
| GET    | `/admin/projects/{id}` | -                                                                    | `AdminProjectDetail`        |
| GET    | `/admin/audit-logs`    | `action, targetType, targetId, page, size`                           | `Page<AuditLog>`            |

- `keyword`
  - 회원: 이름·이메일·학번 부분 일치
  - 프로젝트: 프로젝트명·리더명 부분 일치
- `sort`
  - 회원: `createdAt,desc`(기본), `lastLoginAt,desc`, `projectCount,desc`, `name,asc`
  - 프로젝트: `createdAt,desc`(기본), `name,asc`, `pendingApplicationCount,desc`
- 회원·프로젝트 상세의 조치 이력은 `/admin/audit-logs?targetType=MEMBER&targetId={id}`로 조회합니다.

### 변경

모든 변경 요청의 본문에는 `reason`(5~200자)이 필수입니다. 성공 시 갱신된 요약 객체를 반환합니다.

| Method | Path                                            | Body                               | 설명                |
| ------ | ----------------------------------------------- | ---------------------------------- | ------------------- |
| POST   | `/admin/members/{id}/suspend`                   | `{ days: number \| null, reason }` | 정지(`null`은 영구) |
| POST   | `/admin/members/{id}/unsuspend`                 | `{ reason }`                       | 정지 해제           |
| PATCH  | `/admin/members/{id}/role`                      | `{ role, reason }`                 | 권한 변경           |
| POST   | `/admin/members/{id}/withdraw`                  | `{ reason }`                       | 강제 탈퇴           |
| PATCH  | `/admin/projects/{id}/visibility`               | `{ visibility, reason }`           | 숨김·삭제·복구      |
| POST   | `/admin/projects/{id}/close`                    | `{ reason }`                       | 모집 강제 마감      |
| POST   | `/admin/projects/{id}/members/{memberId}/expel` | `{ reason }`                       | 팀원 강제 제외      |

### 에러 코드

| HTTP | code                      | 상황                                                                 |
| ---- | ------------------------- | -------------------------------------------------------------------- |
| 401  | `UNAUTHORIZED`            | 로그인 필요                                                          |
| 403  | `ADMIN403`                | 관리자 권한 없음                                                     |
| 400  | `ADMIN_INVALID_REQUEST`   | 요청 본문 검증 실패                                                  |
| 400  | `ADMIN_SELF_ACTION`       | 본인 계정 정지·권한 변경·탈퇴                                        |
| 404  | `ADMIN_TARGET_NOT_FOUND`  | 대상 회원·프로젝트·팀원 없음                                         |
| 409  | `ADMIN_LAST_ADMIN`        | 마지막 관리자 권한 해제                                              |
| 409  | `ADMIN_INVALID_STATE`     | 이미 정지됨, 정지 상태 아님, 탈퇴 회원, 동일 노출 상태, 이미 마감 등 |
| 409  | `MEMBER_HAS_LED_PROJECTS` | 노출 중인 프로젝트의 리더를 강제 탈퇴                                |
| 400  | `PROJECT_LEADER_EXPEL`    | 리더를 팀원 강제 제외                                                |

## 백엔드 연쇄 동작

- **정지 회원**
  - 로그인하면 403 `MEMBER_SUSPENDED`를 반환합니다. 메시지에 만료일과 사유를 포함합니다.
  - 기존 세션은 다음 인증 요청부터 401로 처리합니다.
  - `suspendedUntil`이 지나면 자동으로 활성 상태가 됩니다.
- **탈퇴 회원**
  - 로그인과 공개 프로필 조회가 불가능하고, 팀원 검색에서 제외됩니다.
  - 대기 중인 지원서는 `CANCELLED`로 바꾸고, 참여 중인 프로젝트에서 제외합니다.
- **숨김·삭제 프로젝트**
  - 일반 검색, 메인 목록, 상세에서 제외합니다. 상세 조회는 404로 응답합니다.
- **모집 강제 마감**
  - 모든 포지션을 마감하고 `recruitmentStatus`를 `CLOSED`로 바꿉니다.
  - 대기 지원서는 그대로 두며, 리더가 처리합니다.
- **감사 로그**
  - 모든 변경 API는 같은 트랜잭션에서 감사 로그를 남깁니다.
  - 기록 항목: `adminId, adminName, action, targetType, targetId, targetName, reason, metadata, createdAt`
  - `metadata` 예: 정지 기간, 변경 전·후 권한·노출 상태, 제외된 팀원.

## 프론트 구조

```
app/(admin)/layout.tsx                         # RequireAdmin + AdminShell
app/(admin)/admin/**/page.tsx
components/features/admin/                     # 관리자 도메인 UI·API·스키마
components/shared/DataTable.tsx                # 공통 테이블
components/shared/Pagination.tsx               # 공통 페이지네이션
components/shared/BaseSelect.tsx               # 공통 선택 입력
mocks/adminHandlers.ts, mocks/adminStorage.ts  # 관리자 MSW
types/admin.ts
```

## MSW 데모

- **데모 계정**
  - 관리자: 학번 `20260000`
  - 일반 회원: `20260001`
  - 비밀번호는 모두 `demo1234`
- **추가 더미 회원**
  - 학번 `2025xxxx`인 더미 회원 24명을 추가했습니다.
  - 일부는 정지·탈퇴 상태입니다.
- **관리자 조치의 반영 범위**
  - 관리자 조치는 기존 MSW 저장소에 반영되므로 일반 화면에서 연쇄 동작을 바로 확인할 수 있습니다.
  - 예: 정지 회원 로그인 차단, 숨김 프로젝트 검색 제외.
