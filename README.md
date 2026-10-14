# meeTeam Frontend

세종대학교 구성원이 프로젝트를 모집하고 함께할 팀원을 찾는 웹 서비스입니다.

현재 관리 버전은 `0.2.0`입니다. 릴리스 기준 코드는 Git 태그 `v0.2.0`으로 확인합니다.

## 문서

- [변경 이력](CHANGELOG.md)
- [구조 및 인증·API 동작](docs/architecture.md)
- [환경 설정·배포·운영](docs/operations.md)
- [버전 관리·릴리스·롤백 절차](docs/releases.md)

## 주요 기능

- 세종대 포털 기반 로그인·가입 및 로그인 상태에 따른 접근 제어
- 내 프로필 조회·수정, 공개 프로필 조회 및 팀원 검색
- 프로젝트 등록, 이미지 업로드, 검색·필터·정렬 및 무한 스크롤
- 프로젝트 상세·모집 정보·Q&A, 관심 등록 및 지원서 제출·조회·취소
- 프로젝트 모집 정보 수정, 지원자·팀원 관리 및 알림

## 기술 스택

| 영역          | 기술                          |
| ------------- | ----------------------------- |
| 프레임워크    | Next.js 16, React 19          |
| 언어          | TypeScript                    |
| 스타일        | Tailwind CSS v4, Lucide React |
| 상태 관리     | Zustand, TanStack Query       |
| 입력 검증     | Zod                           |
| API 테스트    | MSW                           |
| 컴포넌트 개발 | Storybook                     |
| 단위 테스트   | Vitest                        |
| 코드 품질     | ESLint, Prettier              |

## 시작하기

Node.js 24와 npm을 사용합니다.

```bash
npm ci
npm run dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다.

### 환경 설정

프로젝트 루트의 `.env.local`에 실행 환경을 설정합니다.

`.env.example`을 복사해 시작하고, 실제 비밀번호·토큰 등은 저장소에 올리지 않습니다.

```dotenv
MEETEAM_API_BASE_URL=https://meeteam.fignal.me
NEXT_PUBLIC_SITE_URL=https://www.meeteam.fignal.me
```

- `MEETEAM_API_BASE_URL`: 서버가 요청을 전달할 백엔드 주소입니다. 생략하면 `https://meeteam.fignal.me`를 사용합니다. 별도 개발 서버를 사용하는 경우 해당 환경의 주소로 설정합니다.
- `NEXT_PUBLIC_API_MODE=mock`: 실제 서버 대신 MSW를 사용하는 선택 설정입니다. 생략하면 실제 API를 사용합니다.
- `NEXT_PUBLIC_SITE_URL`: canonical URL과 OG 공유 이미지의 기준 주소입니다. 생략하면 `https://www.meeteam.fignal.me`를 사용합니다.

MSW 모드에서는 `20260001` / `demo1234`로 로그인하고 `20260002` / `demo1234`로 가입 흐름을 확인할 수 있습니다. 실제 서버 계정이 아닌 테스트 계정입니다. 모의 데이터는 브라우저에 저장되며, 정의하지 않은 API 요청은 실제 서버로 전달하지 않습니다.

## 프로젝트 구조

```text
app/                  페이지, 레이아웃 및 서버 API 프록시
components/features/  인증·프로필·프로젝트·팀원·알림 도메인 UI와 API
components/shared/    재사용 가능한 UI 컴포넌트
stores/               공통 클라이언트 상태
types/                공유 타입
mocks/                MSW 핸들러와 모의 데이터
stories/              Storybook 컴포넌트 예시
tests/                단위 테스트와 API 계약 테스트
assets/               컴포넌트에서 가져오는 이미지·아이콘
public/               URL로 접근하는 정적 파일
```

## 개발 방식

- 페이지와 라우팅은 `app/`, 도메인별 기능은 `components/features/`에 배치합니다.
- 공통 UI는 `components/shared/`를 재사용하고 색상은 `app/globals.css`의 디자인 토큰을 사용합니다.
- 공통 상태는 Zustand로 관리하고 서버 데이터 요청은 기능별 API 모듈로 분리합니다.
- 폼 입력은 Zod로 검증하며, 요청 실패 시 입력값을 유지하고 사용자에게 오류를 안내합니다.
- 도메인 전용 스토어와 스키마는 해당 기능 폴더에서 관리합니다.

## API 및 인증

브라우저는 같은 출처의 `/api/v1/*`와 `/api/project-members/*`로 요청하고, Next.js 서버가 백엔드로 전달합니다. 쿠키를 포함해 요청하며 인증 헤더는 메모리에서 관리합니다. 비밀번호와 인증 토큰은 브라우저 `localStorage`에 저장하지 않습니다.

실제 인증은 세종대 포털 계정으로 확인해야 합니다. 백엔드 권한 정책에 따라 본인 지원서의 전체 상세 조회가 제한될 수 있으며, 이 경우 지원 목록 기반 요약·상태와 취소 기능을 제공합니다.

## 개발 명령

```bash
npm run lint             # 코드 검사
npm run format:check     # 포맷 검사
npm run test:unit        # 단위 테스트
npm run storybook        # 컴포넌트 개발 환경
npm run build-storybook  # Storybook 정적 산출물 생성
npm run build            # 서비스 빌드
npm run start            # 빌드한 서비스 실행
```

## 배포

Vercel에 저장소를 연결하고 `main`을 배포 브랜치로 지정합니다. 배포 환경의 `MEETEAM_API_BASE_URL`에 실행 중인 백엔드 주소를 설정합니다. MSW를 사용하는 별도 테스트 배포가 아니라면 `NEXT_PUBLIC_API_MODE=mock`은 설정하지 않습니다.

배포 후 공개 목록 조회와 로그인·세션 유지, 프로필 저장, 프로젝트 등록·지원 흐름을 실제 API 기준으로 확인합니다.
