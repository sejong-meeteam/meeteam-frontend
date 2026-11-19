# 사용성 가설 사전 검증 (baseline)

> 실제 목업 서버(`npm run dev:e2e`, `http://127.0.0.1:3005`)에서 하네스(`ut/harness.mjs`)로 T1~T6을 실행한 결과입니다. 판정은 **화면이 가설 설명대로 동작하는지**만 봅니다. "사용자가 헷갈린다", "오해한다" 같은 인지 반응은 이 단계에서 확인할 수 없으므로 UT로 넘깁니다.

- 실행: `node harness.mjs --label baseline --out $SCR/runs` (2026-11-19, 뷰포트 1280x800, fullPage)
- 스크린샷 루트: `/private/tmp/claude-501/-Users-yeonjun-02-Work-02-Projects-meeteam-frontend/3be2b149-7bd5-4158-9c66-ca38310fa136/scratchpad/ut/runs/baseline` (아래 경로는 이 루트 기준)
- 단계 수: T1 15 · T2 10 · T3 10 · T4 14 · T5 11 · T6 7 (모두 `ok: true`, 실패 단계 없음)
- 단계별 관찰값은 각 과업 폴더의 `steps.json`(`uiState.extra`, `transientMessages`, `disabledButtons`, `nativeDialogs`)에 있습니다.
- 계정: T1 신규(20260002), T2·T3 이준호(20250012), T4~T6 김민지(20260001). T5는 같은 브라우저 컨텍스트에서 목업 API로 박서연·최도윤·정하은(20251001~3)이 프로젝트 101에 먼저 지원한 상태를 만들었습니다(T5/01-seed).

## 판정 요약

| ID | 판정 | 한 줄 근거 |
|---|---|---|
| H-U1 | 재현됨 | 동의 미체크 시 "로그인" 비활성, 이유 표시 없음, 눌러도 아무 반응 없음 |
| H-U2 | 재현됨 | 홈·로그인 화면에 가입 문구/링크 0개, `/auth/sign-up`은 로그인으로 되돌아감 |
| H-U3 | 재현됨 | 10자 조건 미표시, 5자 제출 시 토스트 "지원 사유를…", 화면마다 메시지/사유/동기 |
| H-U4 | 재현됨 | 68자 작성 후 "프로필 수정" → 경고 없이 이동, 돌아오니 0/700자 |
| H-U5 | 재현됨 | 플랫폼 칩은 aria-pressed 토글인데 단일 선택, 기술 스택 누락은 마지막 "등록하기"에서만 오류 |
| H-U6 | 재현됨 | 승인·거절 모두 확인창·토스트 없음, 카드가 사라지고 숫자만 줄어듦 |
| H-U7 | 재현됨 | 공개 프로필에 버튼·링크 0개, 이메일 미노출, 초대 기능 없음 |
| H-U8 | 재현됨 | 가입·등록·프로젝트 필터·팀원 필터·카드 라벨이 모두 다른 분류/명칭 |

---

## H-U1 로그인 동의 체크 — 재현됨

**관찰**
- 학번·비밀번호 입력 후 동의 미체크 상태에서 "로그인" 버튼 `disabled: true`. 버튼에 `title`, `aria-describedby` 없음(`reasonShown: false`). 화면에 이유를 설명하는 문구 없음. (T1/05-fill-credentials.png)
- 비활성 버튼 클릭 시도 후 URL 변화 없음(`urlChanged: false`), 오류·토스트 0건. (T1/06-click-login-without-consent.png)
- 체크박스 옆 문구는 "비밀번호는 저장하지 않으며, 로그인 후 학교 포털에서 로그아웃됩니다." 동의를 요구하는 문장이 아니라 안내문으로 읽힘. 체크박스 자체는 `sr-only` 입력 + 20px 커스텀 상자.
- 문구를 누르면 체크되고 버튼이 켜짐(`loginButtonDisabled: false`). (T1/07-check-consent.png)

**코드**
- `components/features/auth/LoginForm.tsx:211` — `disabled={isSubmitting || !isConsentChecked}`로 버튼을 끔.
- `components/features/auth/LoginForm.tsx:194-197` — 동의 문구가 안내문 형태.
- `components/features/auth/LoginForm.tsx:55`, `:200-204` — `agreement` 오류 표시 영역이 있지만 값을 채우는 곳이 없음(항상 `undefined`). 버튼이 꺼져 있어 제출 자체가 일어나지 않으므로 이 영역은 실제로 나타날 수 없음.

## H-U2 회원가입 입구 — 재현됨

**관찰**
- 홈(/)에서 "회원가입/가입하기/sign up" 등 가입 문구 0건(`signupEntryOnHome: 0`). 헤더에는 "로그인"만 있음. (T1/01-home.png)
- 로그인 화면의 텍스트는 "학번 / 비밀번호 / 비밀번호는 저장하지 않으며… / 로그인"뿐이고, 텍스트가 있는 링크 0개(로고 링크만 존재). (T1/03-look-for-signup.png)
- `/auth/sign-up` 직접 접속 → `/auth/login`으로 되돌아감(`landedOn: "/auth/login"`). (T1/04-guess-signup-url.png)
- 신규 학번(20260002)으로 로그인해야 비로소 `/auth/sign-up/sejong` "세종대 회원가입" 화면이 나옴. (T1/08-submit-login.png)

**코드**
- `app/(auth)/auth/login/page.tsx:9-27` — 로고와 `LoginForm`만 렌더링, 가입 안내 없음.
- `app/(auth)/auth/sign-up/page.tsx:4` — `redirect('/auth/login')`.
- `components/features/auth/LoginForm.tsx:82-94` — 로그인 응답의 `isNewMember`일 때만 가입 화면으로 이동.

## H-U3 지원서 10자 조건과 용어 — 재현됨

**관찰**
- 지원 화면 제목 "지원 메시지", 자리표시 "팀에게 보낼 메시지를 입력해 주세요.", 카운터 "0/700자". 10자 조건을 알리는 문구 없음(`minLengthHintVisible: false`). (T3/03-open-apply.png)
- "열심히할게"(5자, 카운터 "5/700자") 상태에서 "지원서 보내기" → 화면 아래 토스트 "지원 사유를 10자 이상 입력해 주세요." 입력창에는 오류 표시 없음(`invalidFields: []`). 토스트는 4.2초 뒤 사라짐. (T3/04-type-short.png, T3/05-submit-short.png)
- 제출 후 지원서 상세에서는 같은 내용을 "지원 동기"로 표시. (T3/09-retype-and-submit.png)
- 결과적으로 한 흐름에서 **지원 메시지 → 지원 사유 → 지원 동기** 세 용어가 실제로 나타남.

**코드**
- `components/features/project/apply/ProjectApplyPage.tsx:394-396` — "지원 메시지" 제목.
- `components/features/project/apply/ProjectApplyPage.tsx:410-414` — 카운터는 `{length}/700자`만 표시.
- `components/features/project/apply/ProjectApplyPage.tsx:272-274`, `:474` — 검증 실패를 `errorMessage` → `ToastMessage`(토스트)로만 보여줌.
- `components/features/project/apply/schema.ts:8` — "지원 사유를 10자 이상 입력해 주세요."
- `components/features/project/apply/ProjectApplicationDetailPage.tsx:247`, `:251` — "지원 동기".

## H-U4 "프로필 수정" 클릭 시 작성 내용 유실 — 재현됨

**관찰**
- 68자 메시지 작성(카운터 "68/700자") 후 "프로필 수정" 클릭 → 확인창·브라우저 경고 없이(`nativeDialogs: []`, `dialogs: []`) `/profile`로 이동. (T3/06-type-valid.png, T3/07-go-edit-profile.png)
- 도착한 `/profile`은 보기 모드이고 같은 이름의 "프로필 수정" 버튼을 한 번 더 눌러야 편집됨. (T3/07-go-edit-profile.png)
- 브라우저 뒤로 가기로 지원 화면 복귀 → 입력창 비어 있음, 카운터 "0/700자"(`messageLost: true`). (T3/08-come-back.png)

**코드**
- `components/features/project/apply/ProjectApplyPage.tsx:440-446` — `onClick={() => router.push('/profile')}`, 이탈 확인 없음.
- `components/features/project/apply/ProjectApplyPage.tsx:181` — 메시지를 컴포넌트 `useState`에만 보관(임시 저장 없음).

## H-U5 플랫폼 칩 단일 선택, 기술 스택 오류 시점 — 재현됨

**관찰**
- 진입 시 "출시 플랫폼" 칩 3개(Web 눌림, iOS, 안드로이드). 칩은 `role="button"` + `aria-pressed` 토글 형태이고 "하나만 선택" 같은 안내 없음. (T4/02-open-create.png)
- iOS 클릭 → `iOS: pressed`, 이어서 안드로이드 클릭 → iOS가 말없이 해제되고 `안드로이드`만 눌림(`selectedPlatforms: ["안드로이드"]`, `multiSelectWorked: false`). (T4/05-platform-multi.png) 등록된 프로젝트의 플랫폼도 "안드로이드"만 표시. (T4/14-submit.png)
- 4단계 진입 시 라벨이 **"기술 스택(선택)"**으로 표시되고 오류 없음. (T4/10-step4.png)
- 기술 스택 없이 "프로젝트 등록하기" → "각 모집 분야별 기술 스택을 1개 이상 선택해 주세요."(필드 아래 + 토스트), 페이지 유지. (T4/12-submit-without-tech.png)
- 참고: 기술 스택 입력은 4단계에만 있으므로 "마지막 단계에서야 안다"는 구조상 당연합니다. 더 직접적인 마찰은 필수 항목이 "(선택)"으로 표시된다는 점입니다.

**코드**
- `components/features/project/create/ProjectForm.tsx:249-250` — `setSelectedPlatforms([platform])`로 항상 하나만 남김.
- `components/features/project/create/ProjectForm.tsx:593`, `:602`, `:613` — `hintText=""`, `role="button"`, `aria-pressed`.
- `components/features/project/create/ProjectForm.tsx:334-342` — 기술 스택 누락 검증과 문구.
- `components/features/project/create/ProjectForm.tsx:480` — 4단계에서는 최종 제출 시도 전까지 이 오류를 숨김.
- `components/features/auth/TechStackSection.tsx:67` + `components/shared/BaseField.tsx:27-28` — `required={false}`라서 "(선택)"이 붙음.

## H-U6 승인/거절 후 결과 안내 — 재현됨

**관찰**
- 지원자 3명("지원자 목록 3"). 박서연 "승인" 클릭 → 확인창 없음, 1.5초 동안 토스트·상태 메시지 0건(`transientMessages: []`). 카드가 목록에서 사라지고 "지원자 목록 2", 탭 배지 2, 남은 카드의 "현재 0/3명"이 "현재 1/3명"으로 바뀜. (T5/06-open-applicants.png, T5/07-approve.png)
- 최도윤 "거절" 클릭 → 마찬가지로 확인창·토스트 없음, "지원자 목록 1". 되돌리기 수단 없음. (T5/08-reject.png)
- 팀원 관리(`/manage`)에는 박서연이 팀원으로 보임(`approvedVisible: true`). 거절한 최도윤은 팀원 관리에도, 다시 연 지원자 관리 탭에도 없음(`rejectedVisible: false`, 처리 내역 탭 없음). (T5/10-verify-members-list.png, T5/11-verify-rejected.png)
- 정리: 명시적 확인이나 결과 안내는 없고, 숫자 변화와 카드가 사라지는 것으로만 결과를 알 수 있음. 거절은 기록이 어디에도 남지 않음.

**코드**
- `components/features/project/manage/ProjectManageApplicants.tsx:163-196` — `handleDecision`이 성공 시 목록만 갱신하고 토스트·확인 없음(실패 시에만 `errorMessage`).
- `components/features/project/manage/ProjectManageApplicants.tsx:309-333` — 승인/거절 버튼이 바로 `handleDecision` 호출.
- `components/features/project/manage/ProjectManageApplicants.tsx:76`, `:106` — `status === 'pending'`만 남겨 처리된 지원자는 볼 수 없음.

## H-U7 팀원 찾기에서 연락·제안 수단 — 재현됨

**관찰**
- 팀원 찾기 → "디자이너" 4명 → 정하은 카드 클릭 → `/profile/203`. (T6/04-filter-designer.png, T6/05-open-profile.png)
- 공개 프로필 본문에 버튼 0개, 링크 0개, 이메일 미노출(`buttons: []`, `links: []`, `emailVisible: false`). 보이는 정보는 이름, "UI/UX 디자인", "프로젝트 참여 가능", 기술 스택, 자기소개, 참여 프로젝트 0. (T6/06-look-for-contact.png)
- 다른 경로로 내 프로젝트 관리 화면도 찾아봄: `/projects/101/manage/members`는 `/manage`로 돌아가고, 연락·제안·초대 관련 문구 0건(`inviteLike: []`). (T6/07-try-manage-members.png)
- 예외: GitHub·블로그 URL을 등록한 회원은 사이드바에 링크가 보임(김민지 프로필의 "GitHub", T2/10-detail-leader.png). 시드 회원 대부분은 비어 있음.

**코드**
- `components/features/profile/ProfileOverview.tsx:70`, `:415` — 타인 프로필(`memberId` 있음)은 `onAction`을 넘기지 않음.
- `components/features/profile/ProfileSidebar.tsx:92`, `:95` — 액션 버튼은 `onAction`이 있을 때만, 연락처는 GitHub·블로그 값이 있을 때만 표시.
- `app/(with-nav)/projects/[projectId]/manage/members/page.tsx:6` — `/manage`로 리다이렉트.
- 가설 표에 적힌 `ProfileHeader.tsx`는 어디에서도 import되지 않는 미사용 컴포넌트라 원인 위치가 아닙니다.

## H-U8 화면마다 다른 분야 분류 — 재현됨

**관찰 (실제 화면에 나온 값)**

| 화면 | 표시된 분류 | 스크린샷 |
|---|---|---|
| 가입 "직군" | 프론트 / 백엔드 / 디자인 | T1/11-signup-field-options.png |
| 프로젝트 등록 "직군 선택" | 프론트엔드 / 백엔드 / 디자인 | T4/09-roles.png |
| 프로젝트 찾기 "분야" 필터 | 전체 / 백엔드 / 프론트엔드 / 디자인 / 기획 / 마케팅 / 기타 | T2/02-projects-list.png |
| 프로젝트 카드·상세 | "프론트(웹 프론트엔드)", "디자인(UI/UX 디자인)" | T2/02-projects-list.png |
| 팀원 찾기 "분야" 필터 | 전체 / 프론트엔드 / 백엔드 / 디자이너 / PM/기획 / AI / 인프라/운영 | T6/02-teammates.png |
| 팀원 카드 / 공개 프로필 | "디자이너" / "UI/UX 디자인" | T6/04-filter-designer.png, T6/05-open-profile.png |

- 같은 분야가 "프론트 / 프론트엔드", "디자인 / 디자이너"로 화면마다 다르게 불림. 프로젝트 필터에는 "AI", "인프라/운영"이 없고, 팀원 필터에는 "마케팅", "기타"가 없음.
- 프로젝트 필터 "기획" → "총 0개의 프로젝트", "마케팅" → "총 0개의 프로젝트". (T2/04-filter-field-planning.png, T2/05-filter-field-marketing.png) 팀원 필터 "PM/기획" → "총 0명의 팀원". (T6/03-filter-planner.png)
- 주의: 목업의 직군 옵션(`mocks/fixtures.ts:1-38`)에는 프론트·백엔드·디자인 3개만 있어서 "기획" 결과 0건은 목업 데이터 때문일 수 있습니다. 반면 **"마케팅"과 "기타"는 코드에서 무조건 빈 결과를 돌려주므로** 실서버에서도 0건입니다(아래 `projectFindApi.ts`).
- 가설이 가리킨 `constants/interest.ts`(기획/디자인/프론트엔드/백엔드/기타)는 직군 API가 비었을 때만 쓰이는 대체값이라(`ProjectForm.tsx`의 `majorOptions` 분기) 이번 실행 화면에는 나오지 않았습니다. 가입 화면 라벨은 `/api/v1/jobs/options`의 `name`을 그대로 씁니다.

**코드**
- `components/features/project/constants.ts:21-29` — 프로젝트 필터 목록(마케팅·기타 포함, AI·인프라 없음).
- `components/features/project/find/projectFindApi.ts:75-81` — "마케팅"·"기타" 선택 시 요청 없이 빈 배열 반환.
- `components/features/team/constants.ts:9-17` — 팀원 필터 목록("디자이너", "PM/기획").
- `components/features/team/teamApi.ts:155-172` — 직군명 "디자인" → "디자이너", "기획" → "PM/기획"으로 바꿔 표시.
- `components/features/project/projectJobOptions.ts:3-10` — 등록 화면은 코드 기준 라벨("프론트엔드")로 바꿔 표시.
- `constants/interest.ts:1-13` — 대체용 분류.

---

## 추가로 발견한 마찰

1. **필수 항목이 "(선택)"으로 표시됨 (가입).** 가입 화면 라벨이 "기술 스택(선택)"인데 비워 두고 "회원가입 완료"를 누르면 토스트 "기술 스택을 1개 이상 선택해 주세요."로 막힘. (T1/12-signup-field-select.png, T1/13-signup-submit-no-tech.png) — `components/features/auth/SignupTechStackSection.tsx:77`, `components/features/auth/SejongSignupForm.tsx:173-178`. 프로젝트 등록 4단계도 같은 문제(H-U5 참고).
2. **지원 메시지 최대 길이가 두 군데에서 다름.** 입력창과 카운터는 700자(`ProjectApplyPage.tsx:46`, `:406`), 검증 스키마는 1000자(`apply/schema.ts:9`). 제품 브리프에는 "10~1000자"로 적혀 있음.
3. **고친 뒤에도 이전 오류 토스트가 남음.** 프로젝트 명을 입력하고 카테고리를 고른 뒤에도 "프로젝트 이름을 입력해 주세요." 토스트가 화면에 남아 있음(T4/04-basic-info.png, T4/05-platform-multi.png). 가입 화면에서도 이름 입력 후 "이름을 입력해 주세요." 토스트가 남음(T1/10-signup-basic-info.png). 토스트는 4.2초 고정(`stores/useToastStore.ts:25`)이고 필드를 고쳐도 지워지지 않음.
4. **"프로필 수정"이 편집 화면이 아니라 보기 화면으로 감.** 지원 화면의 "프로필 수정" → `/profile` 보기 모드, 같은 이름의 버튼을 한 번 더 눌러야 편집 시작. (T3/07-go-edit-profile.png) — `ProjectApplyPage.tsx:442`.
5. **알림 센터의 안 읽음 수와 목록이 맞지 않아 보임.** 새 지원 알림 3건이 보이는데 머리글은 "0개의 안 읽은 알림", "모두 읽음 처리"는 비활성. (T5/03-notifications.png) 페이지 진입 시 자동으로 읽음 처리되는지는 이번에 확인하지 않음.
6. **"팀원 관리" 탭과 관리 개요가 같은 화면.** 탭 "팀원 관리"는 `/manage`로 가고 `/manage/members`도 `/manage`로 리다이렉트됨. (T5/09-verify-members.png)
7. **목업 데이터가 스크린샷끼리 모순됨 (UT 자료 오염 위험).** 김민지 공개 프로필의 참여 프로젝트에 "캠퍼스 메이커스 4/6명", "스터디 매칭 서비스 3/5명"(리더 김민지로 표시)이 보이지만 목록·상세에서는 각각 1/4명이고 "스터디 매칭 서비스"의 리더는 이준호. (T2/10-detail-leader.png vs T2/02-projects-list.png) 이준호 프로필에도 김민지가 리더인 "API 챌린지 2/4명"이 참여 프로젝트로 나옴. (T3/07-go-edit-profile.png) 원인은 `mocks/fixtures.ts:72-101`의 `DEMO_PROJECTS`가 실제 프로젝트 시드와 따로 놀기 때문. 제품 문제는 아니지만 UT 참여자가 이 스크린샷을 보고 "신뢰할 수 없다"고 반응하면 H-P2 판정이 오염될 수 있음.
8. **프로젝트 상세에 예상 소요 시간·회의 방식 정보가 없음 (H-P2 관련 관찰).** 상세 "모집 포지션"·"소개" 탭에 보이는 것은 카테고리, 팀원 수, 모집 수, 마감일, 플랫폼, 리더 이름, 필요 기술뿐. (T2/08-open-detail.png, T2/09-detail-intro-tab.png)

## 하네스 메모

- 셀렉터는 역할·레이블·텍스트를 먼저 시도하고, 상태에 따라 이름이 바뀌는 드롭다운 등은 `data-cy`를 대안으로 둡니다. 각 단계는 실패해도 `ok:false`로 기록하고 다음 단계로 진행합니다.
- 토스트는 4.2초 뒤 사라지므로 `MutationObserver`로 나타난 모든 `role=status/alert` 문구를 `transientMessages`에 따로 쌓습니다. 스크린샷 시점에 토스트가 사라졌어도 이 값으로 확인할 수 있습니다.
- 재검증: `node harness.mjs --label after --out $SCR/runs`. 단계 슬러그와 순서는 baseline과 같게 유지됩니다.
