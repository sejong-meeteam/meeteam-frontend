# 프로젝트 합류 제안 백엔드 구현 명세

프론트엔드는 MSW 목(`mocks/proposalHandlers.ts`)으로 먼저 개발을 끝냈다. 백엔드는 이 문서의 계약대로 구현하면 프론트 수정 없이 붙는다. 목 핸들러가 곧 **레퍼런스 구현**이므로 응답 모양이 헷갈리면 그 파일을 기준으로 삼는다.

- 프론트 API 호출부: `components/features/project/proposal/proposalApi.ts`
- 요청 검증 스키마: `components/features/project/proposal/schema.ts`
- 응답 타입: `types/proposal.ts`
- 알림 매핑: `components/features/notification/notificationApi.ts` (`PROJECT_PROPOSAL_RECEIVED`)
- 계약 테스트: `tests/unit/project/proposal.test.ts`

## 1. 배경과 기능 요약

합성 페르소나 사용성 테스트(`docs/research/2026-11-synthetic-ut/`)에서 팀원 찾기로 공개 프로필(`/profile/:memberId`)에 들어온 리더가 연락할 방법을 하나도 찾지 못했다(H-U7). 인터뷰에서는 리더 12명 중 11명이 먼저 찾아가 제안하고 싶다고 답했다(H-P5). 반면 받는 쪽은 모르는 사람의 연락을 부담스러워했고, 같은 학교라는 인증이 있으면 부담이 줄어든다고 했다.

그래서 자유 메시지가 아닌 **정해진 형식의 제안**으로 만든다. 제안에는 실제 모집 중인 프로젝트와 열린 포지션이 반드시 붙고, 받는 사람은 프로젝트를 보고 직접 지원할지 정한다. 이번 라운드에는 수락·거절 흐름이 없다.

| #   | 기능                                        | 화면                      | 대상                  |
| --- | ------------------------------------------- | ------------------------- | --------------------- |
| 1   | 제안할 수 있는 내 프로젝트와 포지션 조회    | 공개 프로필 `제안 보내기` | 로그인 사용자         |
| 2   | 제안 보내기 (프로젝트, 포지션, 짧은 메시지) | 공개 프로필 제안 대화상자 | 모집 중 프로젝트 리더 |
| 3   | 제안 도착 알림, 프로젝트 상세로 이동        | 알림 센터, SSE            | 제안받은 회원         |

## 2. 데이터 모델 (제안)

```sql
project_proposal (
  id              BIGINT PK,
  project_id      BIGINT FK project NOT NULL,
  proposer_id     BIGINT FK member NOT NULL,   -- 보낸 시점의 프로젝트 리더
  member_id       BIGINT FK member NOT NULL,   -- 받는 회원
  job_position_id BIGINT FK job_position NOT NULL,
  message         VARCHAR(300) NOT NULL DEFAULT '',
  status          VARCHAR(20) NOT NULL,        -- PENDING (향후 APPLIED, EXPIRED, WITHDRAWN)
  created_at      DATETIME NOT NULL,
  INDEX idx_proposal_proposer_created (proposer_id, created_at),
  INDEX idx_proposal_member (member_id, status)
)
-- 같은 프로젝트·회원 쌍의 PENDING 제안은 하나만. DB가 부분 유니크 인덱스를 지원하지 않으면
-- 서비스에서 잠금 후 확인한다.
```

## 3. 공통 규칙

- 응답 포맷은 기존 API와 같다: `{ "code": "COMMON200", "message": "...", "result": ... }`
- 에러 시 `message`는 **사용자에게 그대로 노출**되므로 한국어 문장으로 보낸다. 프론트는 제안 대화상자 안에 이 문장을 그대로 보여준다.
- 시간은 ISO-8601 (`2026-11-19T13:20:00+09:00`)

에러 코드:

| HTTP | code                              | 상황                                                   | 목의 메시지                                                       |
| ---- | --------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| 401  | (기존 인증 코드)                  | 로그인 필요                                            | `로그인이 필요합니다.`                                            |
| 400  | `PROPOSAL400`                     | 요청 형식 오류, 메시지 300자 초과, 나에게 제안         | 검증 문구 그대로 / `나에게는 제안을 보낼 수 없어요.`              |
| 403  | `PROPOSAL403`                     | 프로젝트 리더가 아님                                   | `프로젝트 리더만 제안을 보낼 수 있어요.`                          |
| 403  | `PROPOSAL_DIFFERENT_UNIVERSITY`   | 보내는 사람과 받는 사람의 학교가 다름                  | `같은 학교 회원에게만 제안할 수 있어요.`                          |
| 404  | `PROJECT404` / `MEMBER404`        | 프로젝트 또는 회원 없음 (탈퇴·정지 회원 포함)          | `프로젝트를 찾을 수 없습니다.` / `회원을 찾을 수 없습니다.`       |
| 409  | `PROPOSAL_PROJECT_NOT_RECRUITING` | 모집 마감, 모집 중지, 마감일 지남                      | `모집 중인 프로젝트로만 제안할 수 있어요.`                        |
| 409  | `PROPOSAL_POSITION_CLOSED`        | 고른 포지션이 이 프로젝트에 없거나 정원이 찼음         | `모집 중인 포지션을 선택해 주세요.`                               |
| 409  | `PROPOSAL_ALREADY_MEMBER`         | 받는 사람이 이미 이 프로젝트의 리더 또는 팀원          | `이미 프로젝트에 함께하고 있는 회원이에요.`                       |
| 409  | `PROPOSAL_DUPLICATE`              | 같은 프로젝트로 같은 회원에게 보낸 PENDING 제안이 있음 | `이미 '{프로젝트명}' 프로젝트로 {이름}님에게 보낸 제안이 있어요.` |
| 429  | `PROPOSAL_RATE_LIMITED`           | 보내는 사람이 최근 24시간 동안 20건 이상 보냄          | `제안은 하루 20건까지 보낼 수 있어요. 내일 다시 시도해 주세요.`   |

## 4. API 명세

### `GET /api/v1/members/{memberId}/proposable-projects` · 로그인 필요

로그인한 사용자가 리더인 프로젝트 가운데 `{memberId}` 회원에게 제안할 수 있는 프로젝트를 돌려준다. 프론트는 제안 대화상자를 열 때마다 호출한다.

포함 조건(모두 만족):

- 내가 리더이고 공개 상태(`VISIBLE`)인 프로젝트
- 모집 중: 모집 상태가 `RECRUITING`이고 마감일이 지나지 않음
- 정원이 남은 모집 포지션이 하나 이상
- 받는 회원이 이미 이 프로젝트의 리더나 팀원이 아님

`openPositions`에는 정원이 남고 마감되지 않은 포지션만 담는다. `hasPendingProposal`은 이 회원에게 보낸 PENDING 제안이 이미 있는지를 뜻하며, 프론트는 이 값으로 해당 프로젝트를 `제안 보냄` 상태로 보여주고 전송 버튼을 막는다.

리더인 모집 중 프로젝트가 없으면 `result: []`를 보낸다. 프론트는 빈 목록이면 "모집 중인 프로젝트가 없어요" 안내와 `프로젝트 만들기` 버튼을 보여준다.

```json
[
  {
    "projectId": 101,
    "projectName": "캠퍼스 메이커스",
    "openPositions": [
      { "jobPositionId": 1, "jobFieldName": "프론트", "jobPositionName": "웹 프론트엔드" }
    ],
    "hasPendingProposal": false
  }
]
```

에러: 401, 400 `PROPOSAL400` (내 memberId), 403 `PROPOSAL_DIFFERENT_UNIVERSITY`, 404 `MEMBER404`

### `POST /api/v1/projects/{projectId}/proposals` · LEADER

요청:

```json
{
  "memberId": 203,
  "jobPositionId": 1,
  "message": "기술 스택이 프로젝트와 잘 맞아서 제안드려요."
}
```

| 필드            | 타입   | 규칙                                                   |
| --------------- | ------ | ------------------------------------------------------ |
| `memberId`      | number | 받는 회원. 필수                                        |
| `jobPositionId` | number | 이 프로젝트에서 모집 중인 포지션. 필수                 |
| `message`       | string | 선택. 앞뒤 공백을 지운 뒤 300자 이하. 비우면 빈 문자열 |

응답 (`COMMON200`):

```json
{
  "proposalId": 1,
  "projectId": 101,
  "memberId": 203,
  "jobPositionId": 1,
  "message": "기술 스택이 프로젝트와 잘 맞아서 제안드려요.",
  "status": "PENDING",
  "createdAt": "2026-11-19T13:20:00+09:00"
}
```

검사 순서(목과 같음): 인증 → 요청 검증 → 프로젝트 존재 → 리더 여부 → 모집 중 여부 → 받는 회원 존재 → 본인 여부 → 같은 학교 → 이미 팀원 → 포지션 모집 중 → 중복 → 일일 한도. 통과하면 제안을 저장하고 같은 트랜잭션 안에서 알림을 만든다(5절).

## 5. 알림

기존 알림 도메인(`/api/v1/notifications`, SSE)에 타입 1개를 추가한다. SSE 이벤트 이름도 type과 같게 보낸다 (`NOTIFICATION_EVENT_TYPES`에 이미 추가됨).

| type                        | 수신자    | payload                                                                                                                               |
| --------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `PROJECT_PROPOSAL_RECEIVED` | 받는 회원 | `projectId`, `projectName`, `proposerId`, `proposerName`, `jobFieldName`, `jobPositionName`, `proposalMessage` (메시지가 없으면 생략) |

프론트 표시:

- 제목: `프로젝트 합류 제안이 도착했습니다.`
- 본문: `{proposerName}님이 '{projectName}' 프로젝트에 {jobPositionName} 포지션으로 함께하자고 제안했어요. “{proposalMessage}” 프로젝트를 살펴보고 직접 지원 여부를 정해보세요.`
- 버튼: `프로젝트 살펴보기` → `/projects/{projectId}?jobField={jobFieldName}&jobPosition={jobPositionName}`. 받는 사람은 상세에서 프로젝트를 보고 해당 포지션의 `지원하기`로 직접 지원한다. 쿼리 이름은 지원 화면(`/projects/{id}/apply`)이 이미 받는 이름과 같다.

알림의 `message` 필드를 보내면 프론트가 본문 대신 그 문구를 그대로 쓴다. 받는 사람이 보낸 사람의 메시지를 그대로 보도록 `message`는 비워 두고 payload의 `proposalMessage`를 쓰는 것을 권장한다.

## 6. 정책

받는 사람의 부담을 줄이는 것이 이 기능의 핵심 제약이다. 아래 규칙은 모두 **서버가** 강제한다. 프론트의 숨김과 비활성화는 안내일 뿐이다.

- **리더만, 모집 중인 프로젝트로만.** 제안은 항상 실제 모집 중인 프로젝트와 열린 포지션에 묶인다. 리더 위임에 대비해 매 요청 리더 여부를 다시 확인한다.
- **같은 학교만.** 보내는 사람과 받는 사람의 학교 인증 정보(가입 시 학교 계정 인증)가 같아야 한다. 목은 이메일 도메인으로 학교를 비교한다(`findUniversityByEmail`).
- **중복 금지.** 같은 프로젝트로 같은 회원에게 PENDING 제안은 하나만 둔다. 동시 요청에 대비해 유니크 제약이나 잠금으로 막는다.
- **일일 한도.** 보내는 사람 기준 최근 24시간 20건. 한도 값은 설정으로 뺀다.
- **팀원 제외.** 이미 프로젝트에 합류한 회원에게는 보낼 수 없다.
- **메시지 길이.** 300자. 서버도 같은 길이로 검증한다.

향후 과제 (이번 라운드 범위 밖):

- **받는 사람의 수신 거부.** 설정 화면에 `제안 받기` 토글을 두고, 끈 회원에게는 `proposable-projects`가 403 `PROPOSAL_RECEIVER_OPTED_OUT`를 돌려준다. 지금은 프로필의 `프로젝트 참여 불가` 상태여도 제안을 막지 않는다.
- **수락·거절과 상태 전이.** 받는 사람이 그 프로젝트에 지원하면 `APPLIED`, 일정 기간(예: 14일) 응답이 없으면 `EXPIRED`, 모집이 끝나면 일괄 `EXPIRED`로 바꾼다. 상태가 바뀌면 같은 쌍으로 다시 보낼 수 있다.
- **보낸 제안 목록.** 리더가 보낸 제안과 상태를 관리 화면에서 확인한다.
- **신고와 차단.** 제안을 스팸으로 신고하면 운영자 화면에 올리고, 반복되면 보내는 사람의 한도를 줄인다.

## 7. 보안 체크리스트

- [ ] 리더 여부, 모집 상태, 포지션 상태를 요청마다 DB 기준으로 재검증
- [ ] 같은 학교 비교는 클라이언트 값이 아니라 서버의 인증 정보로
- [ ] 정지·탈퇴 회원은 보내는 쪽도 받는 쪽도 404로 처리
- [ ] 중복 제안은 동시 요청에서도 하나만 저장 (유니크 제약 또는 잠금)
- [ ] `message`는 저장 전 길이 검증, 출력은 프론트가 텍스트로만 렌더링 (HTML 해석 없음)
- [ ] 일일 한도 카운트는 보내는 사람 기준, 실패한 요청은 세지 않음

## 8. 구현 순서 제안

1. `project_proposal` 테이블과 `POST /projects/{projectId}/proposals` (검증, 중복, 한도)
2. `GET /members/{memberId}/proposable-projects`
3. `PROJECT_PROPOSAL_RECEIVED` 알림과 SSE 이벤트

각 단계가 끝나면 프론트의 MSW를 끄고 실제 API로 붙여 확인한다. 목과 응답 모양이 다르면 이 문서와 `types/proposal.ts`를 기준으로 맞춘다.
