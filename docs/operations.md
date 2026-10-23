# 환경 설정 및 운영

## 환경 변수

| 변수                   | 기본값                          | 용도                                             |
| ---------------------- | ------------------------------- | ------------------------------------------------ |
| `MEETEAM_API_BASE_URL` | `https://meeteam.fignal.me`     | 서버 전용 백엔드 Origin, `/api/v1`을 붙이지 않음 |
| `NEXT_PUBLIC_SITE_URL` | `https://www.meeteam.fignal.me` | 공개 프론트 Origin, canonical·공유 이미지 기준   |
| `NEXT_PUBLIC_API_MODE` | 미설정: 실제 API                | `mock`이면 MSW 사용                              |

Node.js 24를 사용합니다. `.env.example`을 `.env.local`로 복사하고 필요한 값을 수정합니다. `.env.local`과 자격 증명은 커밋하지 않습니다. `NEXT_PUBLIC_*` 변수는 브라우저 코드에 포함될 수 있으므로 비밀값을 넣지 않습니다. 환경 변수 변경 후에는 재배포합니다.

## Vercel 배포

1. 저장소를 `sejong-meeteam/meeteam-frontend`, Production Branch를 `main`으로 지정합니다.
2. 프로젝트 루트에서 Next.js를 빌드하고 Node.js 버전을 24로 지정합니다.
3. Production 환경에 위 API·사이트 주소를 설정합니다. 실제 서비스에서는 모의 API 모드를 활성화하지 않습니다.
4. 서비스 도메인을 연결하고 환경 변수 수정 후 재배포합니다.
5. Vercel 배포 성공 여부와 실제 서비스 응답을 각각 확인합니다. GitHub 태그를 만드는 것만으로 별도 배포가 보장되지는 않습니다.

### Storybook 동시 배포

`vercel.json`의 빌드 명령은 `npm run build:vercel`입니다. `build-storybook:deploy`로 `public/storybook`을 생성한 뒤 `next build`를 실행합니다. Vercel의 출력 디렉터리는 기존 Next.js 자동 설정을 유지합니다. 별도 Storybook 프로젝트·서브도메인·백엔드가 필요하지 않습니다.

공유 주소는 `https://www.meeteam.fignal.me/storybook`이며 `/storybook/index.html`로 리다이렉트합니다. Storybook 페이지를 새로고침해도 같은 정적 파일을 사용합니다. `/storybook/index.json`은 스토리 목록, `/storybook/iframe.html`은 미리보기입니다.

`.storybook/main.ts`는 브랜드·학교 이미지 디렉터리만 정적 입력으로 허용합니다. `public/storybook`을 다시 복사하거나 MSW 워커를 Storybook에 포함하지 않습니다. Vite의 자동 `public` 복사도 비활성화합니다. 생성된 산출물은 Git·ESLint·Prettier 대상에서 제외하며, Storybook 빌드 실패 시 서비스 빌드도 진행하지 않습니다.

Storybook에는 공개 가능한 컴포넌트 예시만 포함합니다. 실제 계정, 토큰, 운영 데이터나 내부 문서를 추가하지 않습니다. 공개 Storybook의 링크·이미지를 확인할 때 실제 프로젝트 데이터를 수정하지 않습니다.

## 배포 후 확인

- 메인·프로젝트·팀원 목록이 정상 표시되는지 확인합니다.
- 프론트 `/api/v1/jobs/options`와 백엔드의 같은 API가 정상 응답하는지 비교합니다.
- 실제 테스트 계정으로 로그인, 새로고침 후 유지, 로그아웃 및 보호 화면 접근을 확인합니다.
- 프로필 저장, 프로젝트 등록, 지원 제출·취소는 승인된 테스트 데이터로 확인합니다.
- 페이지 소스의 `og:image`, `og:url`, canonical이 공개 프론트 도메인을 가리키는지 확인합니다.
- 공유 이미지가 인증 없이 HTTP 200과 이미지 Content-Type으로 반환되는지 확인합니다. 메신저 캐시는 배포 후에도 이전 미리보기를 유지할 수 있습니다.
- `/storybook` 진입·스토리 선택·직접 링크·새로고침과 `/storybook` 하위의 JS·CSS·이미지 응답을 확인합니다. 미리보기의 모달 등 기본 상호작용도 실행합니다.

## 장애 점검

| 현상                  | 확인할 내용                                               |
| --------------------- | --------------------------------------------------------- |
| 프론트 API 502        | 백엔드 직접 응답, API 환경 변수, 서버 연결·로그           |
| 401 반복              | 로그인 응답·갱신 요청 상태, 쿠키 정책, Authorization 전달 |
| 403                   | 사용자 역할·지원 상태·백엔드 권한, 프록시 Origin 검사     |
| 모의 데이터가 표시됨  | 배포의 API 모드 설정, 서비스 워커 해제 여부               |
| 공유 이미지가 안 보임 | 실제 HTML의 이미지 URL, 이미지 HTTP 응답, 메신저 캐시     |

문제를 공유할 때는 경로·상태 코드·비밀값을 제거한 오류 메시지만 전달합니다. 비밀번호, Cookie, Authorization 및 토큰은 공유하지 않습니다.

## 백엔드와 인증서

프론트 배포는 Ubuntu 백엔드 코드 배포와 별개입니다. 백엔드 소스 변경은 서버에서 별도로 배포해야 합니다. 프론트 API 기본 주소 변경이 서버의 DB·Redis·TLS 설정을 수정하지는 않습니다.

인증서 자동 갱신 확인은 백엔드를 운영하는 Ubuntu 서버에서 수행합니다.

```bash
sudo certbot renew --dry-run
```

이 명령은 갱신 가능 여부의 시험이며 프론트 실행에 필요한 명령이 아닙니다. 이미 시험을 통과했다면 매 프론트 배포마다 실행할 필요는 없습니다. 자동 갱신 예약 상태와 실패 알림은 서버 운영자가 관리합니다.
