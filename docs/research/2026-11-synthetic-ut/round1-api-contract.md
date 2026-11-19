# 1차 개선 API 계약 (프론트·백엔드 공통)

리서치 근거는 `interviews/synthesis.md`와 `ut/baseline` 집계에 있습니다. 백엔드 저장소는 `sejong-meeteam/meeteam-backend`이고, 작업 브랜치는 `feat/ut-round1`입니다.

## C1. 협업 방식 정보 (H-P2, 인터뷰에서 가장 큰 고통이었던 일정·통학)

참여자 8명 이상이 지원 전에 회의 방식과 시간 부담을 알고 싶어 했습니다. 지금 상세 화면에는 이 정보가 없습니다.

`Project`에 아래 필드를 추가합니다. 모두 선택 항목이며, 기존 프로젝트는 `null`입니다.

| 필드 | 타입 | 규칙 | 표시 |
|---|---|---|---|
| `meetingMode` | enum `ONLINE` / `OFFLINE` / `HYBRID` | nullable | 온라인 / 대면 / 온·오프라인 병행 |
| `weeklyHours` | Integer | 1~40, nullable | "주 N시간 예상" |
| `meetingNote` | String | 100자 이하, nullable | 예: "화요일 저녁 7시 디스코드" |

- 프로젝트 생성·수정 요청 본문에 위 세 필드를 받습니다. 생성 요청은 `POST /api/v1/projects`(multipart의 JSON 파트)이고, 수정 요청도 기존 엔드포인트를 그대로 씁니다.
- 프로젝트 상세 응답과 목록 카드 응답에 세 필드를 추가합니다. 목록에는 `meetingMode`와 `weeklyHours`만 넣어도 됩니다.
- 프로젝트 검색에 `meetingMode` 필터 파라미터를 추가합니다. 값은 단일이고 선택 항목입니다. `ONLINE`을 고르면 `ONLINE`과 `HYBRID`를 모두 돌려줍니다(원거리 통학생용 "온라인 가능" 필터).

## C2. 프로젝트 카테고리 추가 (인터뷰 P08, P19)

`ProjectCategory`에 `STUDY("스터디")`와 `CONTEST("공모전")`를 추가합니다. 기존 값의 순서와 코드는 바꾸지 않습니다.

## C3. 직군 추가 (H-P3, T2 실패 5명)

`job_field`와 `job_position`을 추가하는 마이그레이션과 시드(`job-seed.sql`)를 만듭니다.

- `MARKETING`(마케팅): `PERFORMANCE_MARKETER` 퍼포먼스 마케터, `CONTENT_MARKETER` 콘텐츠 마케터, `BRAND_MARKETER` 브랜드 마케터
- `DATA`(데이터): `DATA_ANALYST` 데이터 분석가, `DATA_ENGINEER` 데이터 엔지니어, `DATA_SCIENTIST` 데이터 사이언티스트
- 직군별 기술 스택 매핑(`docs/job-tech-stack.md`의 방식)도 추가합니다.
  - 마케팅: GA4, Meta Ads, Google Ads, Notion, Figma, Canva
  - 데이터: Python, R, SQL, Pandas, Tableau, Excel
  - 이미 있는 스킬은 재사용합니다.
- `/api/v1/jobs/options` 응답에 자동으로 포함되게 합니다.

## C4. 지원자 처리 내역 (H-U6)

리더는 이미 처리한 지원자(승인·거절)를 다시 볼 수 있어야 합니다.

- 지원자 목록 조회에 `status` 필터를 추가합니다. 값은 `PENDING`(기본) / `ACCEPTED` / `REJECTED`이고, 지금 엔드포인트가 이미 지원하면 그대로 씁니다.
- 응답 항목에 `decidedAt`(처리 시각)을 추가합니다.

## C5. 프로젝트 제안 (H-U7, H-P5)

명세는 프론트 에이전트가 작성 중인 `docs/project-proposal-backend.md`(프론트 저장소)를 따릅니다.
