# GitHub 연동 백엔드 구현 명세

프론트엔드는 MSW 목(`mocks/githubHandlers.ts`)으로 먼저 개발을 끝냈다. 백엔드는 이 문서의 계약대로 구현하면 프론트 수정 없이 붙는다. 목 핸들러가 곧 **레퍼런스 구현**이므로 응답 모양이 헷갈리면 그 파일을 기준으로 삼는다.

- 프론트 API 호출부: `components/features/project/github/githubApi.ts`, `components/features/profile/githubAccountApi.ts`
- 응답 타입: `types/github.ts`
- 계약 테스트: `tests/unit/project/github.test.ts`

## 1. 기능 요약

| #   | 기능                                                   | 화면                          | 대상            |
| --- | ------------------------------------------------------ | ----------------------------- | --------------- |
| 1   | GitHub 계정 연결 (OAuth)                               | `/settings`                   | 로그인 사용자   |
| 2   | 프로젝트 ↔ 저장소 연결 (GitHub App 설치 → 저장소 선택) | `/projects/:id/manage/github` | 리더            |
| 3   | 공개 개발 현황 (활동 수준, 주간 커밋, 언어, 기여자)    | 프로젝트 상세 `개발 현황` 탭  | 누구나          |
| 4   | 프로젝트 카드 활동 배지                                | 홈, 프로젝트 찾기             | 누구나          |
| 5   | 팀 진행 현황 (열린 PR, 멈춘 PR, 팀원별 기여)           | 상세 `개발 현황` 탭           | 팀원(리더 포함) |
| 6   | 주간 리포트 (머지된 PR, 닫힌 이슈, 팀원 기여)          | 상세 `개발 현황` 탭           | 팀원            |
| 7   | 승인 시 저장소 자동 초대 / 방출·탈퇴 시 권한 회수      | 관리 화면 설정                | 리더            |
| 8   | GitHub 이벤트 알림 (초대, 리뷰 요청, PR 머지)          | 알림                          | 해당 팀원       |

## 2. 아키텍처

**GitHub App 1개**로 OAuth(사용자 식별)와 Installation(저장소 접근)을 모두 처리한다. OAuth App을 따로 만들 필요 없다.

```
[브라우저] ─ API ─> [meeTeam 백엔드] ─ Installation Token ─> [GitHub REST/GraphQL]
                          ▲
                          └── Webhook (push, pull_request, ...) ── [GitHub]
```

- 브라우저는 GitHub API를 직접 호출하지 않는다. (비인증 60회/시간 제한, 토큰 노출 방지)
- 조회 API는 **DB/캐시에 저장된 집계값**을 반환하고, 값 갱신은 webhook + 주기 동기화로 한다. 요청마다 GitHub을 호출하지 않는다.

### GitHub App 설정

| 항목                                           | 값                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| Callback URL (OAuth)                           | `https://{api}/api/v1/github/oauth/callback`                      |
| Setup URL (설치 후)                            | `https://{api}/api/v1/github/app/setup` (Redirect on update 체크) |
| Webhook URL                                    | `https://{api}/api/v1/github/webhooks` + Secret                   |
| Request user authorization during installation | 끔 (계정 연결은 설정 화면에서 따로)                               |

Repository permissions:

| 권한           | 수준         | 용도                                                                        |
| -------------- | ------------ | --------------------------------------------------------------------------- |
| Metadata       | Read         | 필수                                                                        |
| Contents       | Read         | 커밋 통계, 언어                                                             |
| Pull requests  | Read         | PR 목록·리뷰 상태                                                           |
| Issues         | Read         | 이슈 수, 닫힌 이슈                                                          |
| Administration | Read & write | **협업자 초대/제거** (`PUT/DELETE /repos/{o}/{r}/collaborators/{username}`) |

Webhook events: `installation`, `installation_repositories`, `push`, `pull_request`, `pull_request_review`, `issues`, `member`, `repository`

> 코드 내용 자체는 저장하지 않는다. 화면 문구도 "코드 내용은 읽지 않아요"로 안내하고 있으니 Contents 권한은 통계 API 용도로만 쓴다.

## 3. 데이터 모델 (제안)

```sql
-- 사용자 GitHub 계정 (1:1)
member_github_account (
  member_id        BIGINT PK FK,
  github_user_id   BIGINT UNIQUE NOT NULL,   -- login은 바뀔 수 있으므로 id로 매칭
  login            VARCHAR(39) NOT NULL,
  avatar_url       VARCHAR(500),
  connected_at     DATETIME NOT NULL
)

-- 프로젝트별 App 설치 (설치 콜백에서 생성)
project_github_installation (
  project_id       BIGINT PK FK,
  installation_id  BIGINT NOT NULL,
  installed_by     BIGINT FK member,
  installed_at     DATETIME NOT NULL
)

-- 프로젝트 ↔ 저장소 (1:1, 저장소는 한 프로젝트에만)
project_github_repository (
  project_id              BIGINT PK FK,
  github_repository_id    BIGINT UNIQUE NOT NULL,
  full_name               VARCHAR(200) NOT NULL,
  html_url                VARCHAR(500) NOT NULL,
  description             VARCHAR(500),
  is_private              BOOLEAN NOT NULL,
  default_branch          VARCHAR(100) NOT NULL,
  auto_invite_on_approval BOOLEAN NOT NULL DEFAULT TRUE,
  auto_revoke_on_removal  BOOLEAN NOT NULL DEFAULT TRUE,
  linked_at               DATETIME NOT NULL
)

-- 저장소 집계 스냅샷 (동기화 잡이 갱신, 조회 API는 여기서 읽음)
github_repository_snapshot (
  github_repository_id    BIGINT PK,
  stars INT, forks INT, open_issue_count INT, open_pull_request_count INT,
  last_pushed_at          DATETIME,
  weekly_commits_json     JSON,   -- 최근 8주, 오래된 주 → 최근 주
  languages_json          JSON,   -- [{name, percentage}]
  contributors_json       JSON,   -- [{githubUserId, login, avatarUrl, commits}]
  synced_at               DATETIME NOT NULL
)

-- 팀원 초대 상태
project_github_collaborator (
  project_id       BIGINT,
  member_id        BIGINT,
  status           ENUM('INVITED','ACTIVE','FAILED') NOT NULL,
  invitation_id    BIGINT NULL,          -- 초대 취소용
  invited_at       DATETIME,
  failure_reason   VARCHAR(300),
  PRIMARY KEY (project_id, member_id)
)

-- 주간 리포트·기여도 계산용 이벤트 로그 (webhook 적재)
github_activity_event (
  id BIGINT PK,
  github_repository_id BIGINT, type ENUM('COMMIT','PR_OPENED','PR_MERGED','REVIEW','ISSUE_OPENED','ISSUE_CLOSED'),
  github_user_id BIGINT, number INT NULL, title VARCHAR(300) NULL, url VARCHAR(500) NULL,
  occurred_at DATETIME, INDEX (github_repository_id, occurred_at)
)
```

열린 PR 목록(진행 현황)은 `pull_request` webhook으로 별도 테이블(`github_pull_request`)에 upsert하거나, 조회 시 GraphQL로 가져와 5분 캐시해도 된다.

## 4. 공통 규칙

- 응답 포맷은 기존 API와 같다: `{ "code": "COMMON200", "message": "...", "result": ... }`
- 에러 시 `message`는 **사용자에게 그대로 노출**되므로 한국어 문장으로 보낸다.
- 시간은 ISO-8601 (`2026-11-05T13:20:00+09:00`), 날짜는 `YYYY-MM-DD`
- 주(week)는 **Asia/Seoul 기준 월요일 00:00 ~ 일요일 23:59:59**
- 권한:
  - `PUBLIC`: 비로그인 포함
  - `MEMBER`: 프로젝트 리더 또는 합류한 팀원
  - `LEADER`: 프로젝트 리더

에러 코드:

| HTTP | code                           | 상황                                                                           |
| ---- | ------------------------------ | ------------------------------------------------------------------------------ |
| 401  | (기존 인증 코드)               | 로그인 필요                                                                    |
| 403  | `GITHUB403`                    | 권한 없음 (`프로젝트 팀원만 볼 수 있어요.` / `프로젝트 관리 권한이 없습니다.`) |
| 404  | `GITHUB_REPOSITORY_NOT_LINKED` | 연결된 저장소 없음                                                             |
| 409  | `GITHUB_APP_NOT_INSTALLED`     | App 미설치 상태에서 저장소 조회·연결                                           |
| 409  | `GITHUB_REPOSITORY_TAKEN`      | 다른 프로젝트에 이미 연결된 저장소                                             |
| 409  | `GITHUB_ACCOUNT_NOT_LINKED`    | 초대 대상 팀원이 GitHub 계정 미연결                                            |
| 400  | `GITHUB400`                    | 잘못된 파라미터                                                                |
| 502  | `GITHUB_UPSTREAM_ERROR`        | GitHub API 실패 (재시도 가능)                                                  |

## 5. API 명세

### 5.1 계정 연결 (`/api/v1/members/me/github`)

#### `GET /api/v1/members/me/github` · 로그인 필요

연결 전이면 `result: null`.

```json
{
  "login": "minji-dev",
  "avatarUrl": "https://avatars.githubusercontent.com/u/1?v=4",
  "profileUrl": "https://github.com/minji-dev",
  "connectedAt": "2026-11-05T13:20:00+09:00"
}
```

#### `GET /api/v1/members/me/github/authorize-url?redirectPath=/settings` · 로그인 필요

```json
{ "authorizeUrl": "https://github.com/login/oauth/authorize?client_id=...&state=..." }
```

- `redirectPath`는 `/`로 시작하는 내부 경로만 허용 (오픈 리다이렉트 방지)
- `state` = 서명된 토큰 `{ memberId, redirectPath, nonce, exp(10분) }`

#### `GET /api/v1/github/oauth/callback?code&state` (GitHub → 백엔드)

1. `state` 검증 → `code`로 user access token 교환 → `GET /user`로 `id`, `login`, `avatar_url` 조회
2. `member_github_account` upsert. 같은 `github_user_id`가 다른 회원에 연결돼 있으면 실패 처리
3. user token은 **저장하지 않는다** (식별에만 사용)
4. 프론트로 302: `{FRONT_ORIGIN}{redirectPath}?github=connected` (실패 시 `?github=failed`)
5. 연결 직후, 이 회원이 속한 프로젝트 중 `auto_invite_on_approval = true`이고 아직 초대 기록이 없는 저장소가 있으면 초대를 보낸다.

#### `DELETE /api/v1/members/me/github` · 로그인 필요

`result: null`. 이미 받은 저장소 권한은 건드리지 않는다.

### 5.2 저장소 연결 (리더)

#### `GET /api/v1/projects/{projectId}/github` · LEADER

```json
{
  "isAppInstalled": true,
  "repository": {
    "id": 123456,
    "fullName": "sejong-meeteam/campus-makers",
    "htmlUrl": "https://github.com/sejong-meeteam/campus-makers",
    "description": "세종대 메이커 스페이스 예약",
    "isPrivate": false,
    "defaultBranch": "main",
    "stars": 24,
    "forks": 5
  },
  "settings": { "autoInviteOnApproval": true, "autoRevokeOnRemoval": true }
}
```

`repository`는 미연결 시 `null`, `settings`는 미연결이어도 기본값(true/true)으로 내려준다.

#### `GET /api/v1/projects/{projectId}/github/install-url` · LEADER

```json
{ "installUrl": "https://github.com/apps/meeteam/installations/new?state=..." }
```

`state` = 서명 토큰 `{ projectId, memberId, nonce, exp }`

#### `GET /api/v1/github/app/setup?installation_id&setup_action&state` (GitHub → 백엔드)

1. `state` 검증 후 리더인지 다시 확인
2. `project_github_installation` upsert
3. 302: `{FRONT_ORIGIN}/projects/{projectId}/manage/github?installed=1`

이미 다른 프로젝트에서 설치한 계정/조직이면 GitHub이 설치 화면 대신 설정 화면으로 보낼 수 있다. 이때도 `installation_id`로 매핑만 추가하면 된다.

#### `GET /api/v1/projects/{projectId}/github/repositories` · LEADER

Installation이 접근 가능한 저장소 목록 (`GET /installation/repositories`). **다른 프로젝트에 연결된 저장소는 제외**한다. 응답은 위 `repository` 객체 배열. 미설치 → 409 `GITHUB_APP_NOT_INSTALLED`.

#### `PUT /api/v1/projects/{projectId}/github/repository` · LEADER

```json
{ "repositoryId": 123456 }
```

- 해당 installation이 접근 가능한 저장소인지 확인
- 다른 프로젝트에 연결돼 있으면 409 `GITHUB_REPOSITORY_TAKEN`
- 저장 후 **즉시 1회 스냅샷 동기화를 비동기로 트리거**
- `auto_invite_on_approval = true`이면 GitHub 계정이 있는 기존 팀원에게 초대 발송
- 응답: `GET /github`와 같은 형태

#### `DELETE /api/v1/projects/{projectId}/github/repository` · LEADER

연결 해제. 이미 초대된 팀원의 권한은 유지한다 (화면 안내 문구와 일치). 응답: `GET /github` 형태.

#### `PATCH /api/v1/projects/{projectId}/github/settings` · LEADER

```json
{ "autoInviteOnApproval": false, "autoRevokeOnRemoval": true }
```

응답: 저장된 settings. 미연결 → 404 `GITHUB_REPOSITORY_NOT_LINKED`.

### 5.3 팀원 저장소 권한 (리더)

#### `GET /api/v1/projects/{projectId}/github/collaborators` · LEADER

프로젝트 멤버 전원(리더 포함)을 내려준다.

```json
[
  {
    "memberId": 1,
    "name": "김민지",
    "profileImageUrl": null,
    "isLeader": true,
    "githubLogin": "minji-dev",
    "accessStatus": "ACTIVE",
    "invitedAt": null
  },
  {
    "memberId": 2,
    "name": "이준호",
    "profileImageUrl": null,
    "isLeader": false,
    "githubLogin": "junho-api",
    "accessStatus": "INVITED",
    "invitedAt": "2026-11-05T13:20:00+09:00"
  }
]
```

`accessStatus` 결정 규칙:

| 값                  | 조건                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `NO_GITHUB_ACCOUNT` | 회원이 GitHub 계정 미연결                                                                                             |
| `ACTIVE`            | 리더(설치자), 또는 협업자 확인됨 (`member` webhook `added`, 혹은 `GET /repos/{o}/{r}/collaborators/{username}` → 204) |
| `INVITED`           | 초대 발송 후 아직 수락 안 함                                                                                          |
| `FAILED`            | 초대 API 실패 (조직 정책, 좌석 부족 등). `failure_reason` 기록                                                        |
| `NOT_INVITED`       | 위에 해당 없음 (자동 초대가 꺼져 있었음)                                                                              |

#### `POST /api/v1/projects/{projectId}/github/collaborators/{memberId}/invite` · LEADER

- `PUT /repos/{owner}/{repo}/collaborators/{login}` (permission: `push`)
- 응답 201이면 `INVITED` + `invitation_id` 저장, 204(이미 협업자)이면 `ACTIVE`
- 같은 API로 **재전송**도 처리 (INVITED/FAILED 상태에서 다시 호출)
- 리더 본인, 비팀원 → 400 / 계정 미연결 → 409 `GITHUB_ACCOUNT_NOT_LINKED`
- 성공 시 대상에게 `GITHUB_REPO_INVITED` 알림 발송
- 응답: 갱신된 collaborator 객체 1개

### 5.4 공개 개발 현황

#### `GET /api/v1/projects/{projectId}/github/activity` · PUBLIC

미연결이면 `result: null` (에러 아님).

```json
{
  "repository": { "...": "5.2와 동일" },
  "activityLevel": "ACTIVE",
  "lastPushedAt": "2026-11-05T08:00:00+09:00",
  "weeklyCommits": [3, 5, 8, 6, 9, 12, 10, 14],
  "openPullRequestCount": 4,
  "openIssueCount": 7,
  "languages": [
    { "name": "TypeScript", "percentage": 68.4 },
    { "name": "CSS", "percentage": 17.9 }
  ],
  "contributors": [
    {
      "login": "minji-dev",
      "avatarUrl": "...",
      "commits": 52,
      "memberId": 1,
      "memberName": "김민지"
    },
    {
      "login": "outside-dev",
      "avatarUrl": "...",
      "commits": 3,
      "memberId": null,
      "memberName": null
    }
  ],
  "syncedAt": "2026-11-05T12:50:00+09:00"
}
```

계산 규칙:

| 필드                   | 규칙 / 출처                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `activityLevel`        | 기본 브랜치 마지막 push가 7일 이내 `ACTIVE`, 30일 이내 `MODERATE`, 그 외 `DORMANT`                                             |
| `weeklyCommits`        | 길이 **항상 8**, 오래된 주 → 이번 주. `GET /repos/{o}/{r}/stats/commit_activity` (202면 잠시 후 재시도) 또는 push webhook 집계 |
| `languages`            | `GET /repos/{o}/{r}/languages` 바이트 → 백분율(소수 1자리), 상위 5개 + 나머지는 `Other`                                        |
| `contributors`         | `GET /repos/{o}/{r}/contributors` 상위 10명. `github_user_id`로 `member_github_account`와 매칭해서 `memberId/memberName` 채움  |
| `openPullRequestCount` | 열린 PR 수 (draft 포함)                                                                                                        |
| `syncedAt`             | 스냅샷 갱신 시각                                                                                                               |

**비공개 저장소 + 비팀원** 조회 시 `contributors: []`로 내려서 GitHub 아이디를 숨긴다. 나머지 집계값은 공개해도 된다.

### 5.5 프로젝트 카드 목록

기존 목록 API(홈 `/api/v1/main/projects`, 검색 `/api/v1/projects/search` 등)의 카드 아이템에 필드 1개 추가:

```json
{
  "projectId": 101,
  "...": "기존 필드",
  "githubActivity": { "activityLevel": "ACTIVE", "lastPushedAt": "2026-11-05T08:00:00+09:00" }
}
```

미연결이면 `null`. 목록 쿼리에서 `project_github_repository` + `github_repository_snapshot`을 LEFT JOIN하면 된다. (N+1 주의)

### 5.6 팀 진행 현황 (팀원)

#### `GET /api/v1/projects/{projectId}/github/progress` · MEMBER

```json
{
  "periodStart": "2026-10-08",
  "periodEnd": "2026-11-05",
  "pullRequests": [
    {
      "number": 48,
      "title": "장비 대여 신청 폼 검증 추가",
      "url": "https://github.com/sejong-meeteam/campus-makers/pull/48",
      "authorLogin": "minji-dev",
      "authorMemberName": "김민지",
      "isDraft": false,
      "reviewState": "REVIEW_REQUIRED",
      "createdAt": "2026-11-04T17:00:00+09:00",
      "updatedAt": "2026-11-05T07:00:00+09:00",
      "isStale": false
    }
  ],
  "contributions": [
    {
      "memberId": 1,
      "name": "김민지",
      "githubLogin": "minji-dev",
      "commits": 52,
      "mergedPullRequests": 8,
      "reviews": 10
    }
  ]
}
```

- `pullRequests`: **열린 PR 전부**. 정렬은 프론트가 한다.
- `reviewState`: GraphQL `PullRequest.reviewDecision` 값 그대로 (`REVIEW_REQUIRED` / `APPROVED` / `CHANGES_REQUESTED`). null이면 `REVIEW_REQUIRED`
- `isStale`: `!isDraft && reviewState != APPROVED && updatedAt < now - 72h`
- `contributions`: **최근 28일**, 프로젝트 멤버 전원(계정 미연결이면 `githubLogin: null`, 수치 0). `github_activity_event`에서 집계
  - commits: 기본 브랜치에 들어온 커밋 (push webhook의 commits, author 매칭)
  - mergedPullRequests: 해당 멤버가 작성한 PR 중 기간 내 머지
  - reviews: 해당 멤버가 남긴 review 제출 수 (`pull_request_review` submitted)
- 미연결 → 404 `GITHUB_REPOSITORY_NOT_LINKED`

### 5.7 주간 리포트 (팀원)

#### `GET /api/v1/projects/{projectId}/github/weekly-report?weekStart=2026-11-02` · MEMBER

```json
{
  "weekStart": "2026-11-02",
  "weekEnd": "2026-11-08",
  "summary": { "commits": 18, "mergedPullRequests": 3, "openedIssues": 2, "closedIssues": 1 },
  "mergedPullRequests": [
    {
      "number": 30,
      "title": "로그인 세션 만료 처리",
      "url": "https://github.com/.../pull/30",
      "authorLogin": "minji-dev",
      "authorMemberName": "김민지",
      "mergedAt": "2026-11-03T15:00:00+09:00"
    }
  ],
  "closedIssues": [
    {
      "number": 60,
      "title": "목록 정렬 기준 오류",
      "url": "https://github.com/.../issues/60",
      "closedAt": "2026-11-04T15:00:00+09:00"
    }
  ],
  "contributions": [{ "...": "5.6과 같은 형태, 해당 주 기준" }]
}
```

- `weekStart`는 월요일이어야 한다. 아니면 400 (또는 해당 주 월요일로 보정해도 됨)
- 미래 주 → 400 `아직 시작하지 않은 주입니다.`
- 이번 주는 진행 중인 값으로 반환
- 지난 주 리포트는 월요일 새벽 배치로 확정·캐시해 두면 좋다
- 마크다운 변환은 프론트(`buildWeeklyReportMarkdown`)가 하므로 백엔드는 데이터만 준다

## 6. 기존 도메인 흐름에 걸어야 할 훅

| 이벤트 (기존 API)                                                                   | 추가 동작                                                                                                                                            |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 지원 승인 `POST /api/v1/projects/{id}/applications/{applicationId}/decision` (승인) | 저장소 연결 + `auto_invite_on_approval` + 지원자 계정 연결됨 → 초대 발송, `GITHUB_REPO_INVITED` 알림                                                 |
| 팀원 방출 `DELETE /api/v1/projects/{id}/members/{memberId}`                         | `auto_revoke_on_removal`이면 `DELETE /repos/{o}/{r}/collaborators/{login}` + 대기 중 초대 있으면 `DELETE /repos/{o}/{r}/invitations/{invitation_id}` |
| 팀원 탈퇴 `POST /api/project-members/withdraw`                                      | 위와 동일                                                                                                                                            |
| 프로젝트 삭제                                                                       | 연결 레코드 삭제 (저장소 권한은 유지)                                                                                                                |
| 회원 탈퇴                                                                           | `member_github_account` 삭제                                                                                                                         |

- 초대/회수는 **트랜잭션 커밋 이후 비동기**로 실행하고, 실패해도 원래 요청(승인/방출)은 성공으로 둔다. 실패는 `project_github_collaborator.status = FAILED`로 남겨 리더가 화면에서 재시도할 수 있다.
- 리더 본인은 회수 대상에서 제외한다.

## 7. Webhook 처리 (`POST /api/v1/github/webhooks`)

- `X-Hub-Signature-256` HMAC 검증 필수, `X-GitHub-Delivery`로 중복 수신 무시
- 202를 바로 응답하고 큐에서 처리

| 이벤트                                        | 처리                                                                                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `installation` (deleted/suspend)              | 해당 installation의 프로젝트 연결 비활성화                                                                                                                                                                          |
| `installation_repositories` (removed)         | 제거된 저장소에 연결된 프로젝트 연결 해제                                                                                                                                                                           |
| `push` (기본 브랜치)                          | `last_pushed_at` 갱신, 커밋 이벤트 적재                                                                                                                                                                             |
| `pull_request`                                | opened/closed(merged)/reopened/ready_for_review/review_requested 적재, 열린 PR 갱신. `review_requested` → 리뷰어가 회원이면 `GITHUB_REVIEW_REQUESTED` 알림, `closed && merged` → 작성자에게 `GITHUB_PR_MERGED` 알림 |
| `pull_request_review` (submitted)             | 리뷰 이벤트 적재, reviewDecision 재조회                                                                                                                                                                             |
| `issues` (opened/closed)                      | 이슈 이벤트 적재, open issue 수 갱신                                                                                                                                                                                |
| `member` (added/removed)                      | 협업자 상태 `ACTIVE` 전환 / 제거                                                                                                                                                                                    |
| `repository` (renamed/transferred/privatized) | `full_name`, `html_url`, `is_private` 갱신                                                                                                                                                                          |

**주기 동기화**: 연결된 저장소마다 30분~1시간 간격으로 스냅샷(언어, 스타, 기여자, 주간 커밋)을 다시 계산한다. Webhook이 유실돼도 값이 맞춰지도록 하기 위함이다. Rate limit은 installation당 시간당 5,000회(조직은 더 많음)라 충분하다.

## 8. 알림

기존 알림 도메인(`/api/v1/notifications`, SSE)에 타입 3개를 추가한다. payload는 기존 형태를 재사용한다.

| type                      | 수신자             | payload                                                 |
| ------------------------- | ------------------ | ------------------------------------------------------- |
| `GITHUB_REPO_INVITED`     | 초대받은 팀원      | `projectId`, `projectName`                              |
| `GITHUB_REVIEW_REQUESTED` | 리뷰 요청받은 팀원 | `projectId`, `projectName` (+ `message`에 PR 제목 권장) |
| `GITHUB_PR_MERGED`        | PR 작성자          | `projectId`, `projectName` (+ `message`에 PR 제목 권장) |

`message`를 보내면 프론트가 그 문구를 그대로 쓰고, 없으면 기본 문구를 쓴다. SSE 이벤트 이름도 type과 같게 보낸다 (`NOTIFICATION_EVENT_TYPES`에 이미 추가됨).

## 9. 보안 체크리스트

- [ ] OAuth/설치 `state`는 서명 + 만료 + 1회용 nonce
- [ ] `redirectPath`는 내부 경로만 허용
- [ ] Webhook 서명 검증, 미검증 요청 401
- [ ] GitHub App private key, webhook secret은 시크릿 매니저에 보관
- [ ] Installation token은 요청 시 발급(1시간 유효), DB 저장 안 함
- [ ] 회원 매칭은 `login`이 아니라 `github_user_id`로
- [ ] 비공개 저장소 정보는 MEMBER 권한에서만 상세 노출
- [ ] 리더 권한 API는 매 요청 리더 여부 재검증 (리더 위임 대비)

## 10. 구현 순서 제안

1. GitHub App 등록 + 계정 연결 (5.1) → 설정 화면 동작 확인
2. App 설치 / 저장소 연결 (5.2) + 스냅샷 동기화 잡 → 상세 `개발 현황` 공개 영역, 카드 배지 (5.4, 5.5)
3. Webhook 수신 + 이벤트 적재 → 팀 진행 현황, 주간 리포트 (5.6, 5.7)
4. 초대/회수 훅 + 협업자 API (5.3, 6) + 알림 (8)

각 단계가 끝나면 프론트의 MSW를 끄고 실제 API로 붙여 확인한다. 목과 응답 모양이 다르면 이 문서와 `types/github.ts`를 기준으로 맞춘다.
