# 애플리케이션 구조

## 구성 원칙

Next.js App Router와 TypeScript를 사용합니다. 라우트와 레이아웃은 `app/`, 도메인 UI·API·전용 상태는 `components/features/`, 공통 UI는 `components/shared/`에 둡니다. 도메인은 인증, 프로필, 프로젝트, 팀원 및 알림으로 나눕니다.

Zustand는 인증과 클라이언트 UI 상태를 관리하고 TanStack Query는 이를 사용하는 기능의 서버 데이터 조회에 사용합니다. 입력 검증은 도메인별 Zod 스키마를 사용합니다. 모든 API 요청이 TanStack Query를 거치는 구조는 아닙니다.

## 주요 코드 위치

| 역할                          | 위치                                                  |
| ----------------------------- | ----------------------------------------------------- |
| 루트 레이아웃·공통 메타데이터 | `app/layout.tsx`                                      |
| 프로젝트 공유 메타데이터      | `app/(with-nav)/projects/[projectId]/page.tsx`        |
| API 전달·쿠키 처리            | `app/api/upstreamProxy.ts`                            |
| 인증 요청·401 재시도          | `components/features/auth/apiClient.ts`               |
| 세션 초기화                   | `components/features/auth/AuthSessionBootstrap.tsx`   |
| 실제 API·MSW 모드 선택        | `components/features/auth/ApiProvider.tsx`            |
| 프로필 조회·수정              | `components/features/profile/profileApi.ts`           |
| 프로젝트 등록·상세·지원·관리  | `components/features/project/projectApi.ts`           |
| 프로젝트 목록 탐색            | `components/features/project/find/projectFindApi.ts`  |
| 팀원 탐색                     | `components/features/team/teamApi.ts`                 |
| 알림                          | `components/features/notification/notificationApi.ts` |

## API 요청

브라우저는 프론트 도메인의 `/api/v1/*` 또는 `/api/project-members/*`로 요청합니다. Next.js 서버가 `MEETEAM_API_BASE_URL`의 같은 경로로 전달합니다. 프로젝트 상세 메타데이터는 서버에서 백엔드를 직접 조회합니다.

프록시는 요청의 메서드·본문·쿼리와 필요한 인증 헤더·쿠키를 전달합니다. 응답의 인증 헤더와 쿠키도 전달하며 `Set-Cookie`의 `Domain` 속성을 제거해 프론트 호스트에서 쿠키를 받을 수 있게 합니다. 쿠키의 Secure·SameSite·Path 정책은 백엔드 설정과 함께 확인해야 합니다.

프록시는 요청 Origin이 존재할 때 프론트 Origin과 일치하는지 검사합니다. 이는 모든 보안 검증을 대체하지 않으며 백엔드가 인증·권한을 최종 판단합니다. 서버 연결 예외는 `API_UNAVAILABLE` 코드와 HTTP 502로 반환합니다.

## 인증 및 세션

`apiFetch`는 쿠키를 포함해 요청하고 성공 응답의 `authorization` 헤더를 메모리에 보관합니다. 일반 요청이 401이면 동시에 발생한 갱신 요청을 하나로 모아 `/api/v1/auth/refresh`를 호출하고 원래 요청을 재시도합니다. 갱신 실패 또는 재시도 401 시 세션 만료 이벤트를 발생시킵니다.

앱 초기화에서는 인증 스토어 준비 후 내 프로필을 조회해 세션을 복원합니다. 비밀번호·인증 토큰은 `localStorage`에 저장하지 않습니다. 보호 화면은 인증 상태에 따라 로그인 안내와 대체 화면을 제공합니다.

## 모의 API

`NEXT_PUBLIC_API_MODE=mock`일 때만 MSW를 시작합니다. 모의 API의 정의되지 않은 요청은 실제 서버로 전달하지 않습니다. 실제 API 모드에서는 이전 MSW 서비스 워커를 해제하고 초기화한 다음 화면을 표시합니다.

MSW 검증은 요청 계약과 UI 상태 검증을 위한 것으로, 실제 서버의 인증·권한·영속성 확인을 대신하지 않습니다.

## 알림·관리·Q&A 상태 처리

알림 목록 조회에는 백엔드의 전체 읽음 처리 효과가 있으므로 목록·읽음 버튼 처리 후 서버 미확인 개수를 재조회합니다. 실시간 수신은 인증 헤더를 전달할 수 있는 fetch SSE를 사용하고, 재연결 ID·중복 이벤트·요청 취소를 처리합니다.

승인·거절·방출 후 관리 헤더를 재조회하며, 탈퇴 후에는 상세의 모집 상태를 갱신합니다. 모집 완료는 서버의 자동 마감 상태이고 수동 중단·재개와 구분합니다. 비밀 Q&A는 인증 사용자 변경 시 재조회하고 역할별로 가립니다. 자세한 계약과 테스트 범위는 [서비스 검증](service-verification.md)을 참고합니다.

## 공유 메타데이터

`NEXT_PUBLIC_SITE_URL`을 canonical·OG·Twitter URL의 기준으로 사용하며 기본값은 `https://www.meeteam.fignal.me`입니다. 기본 공유 이미지는 `/brand/meeteam_logo_hat.png`이고 프로젝트 상세는 프로젝트 커버 또는 대체 이미지를 사용합니다. Vercel의 배포별 URL을 기본 기준으로 사용하지 않습니다.
