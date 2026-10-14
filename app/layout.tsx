import type { Metadata } from 'next';
import AuthSessionBootstrap from '@/components/features/auth/AuthSessionBootstrap';
import LoginPromptModal from '@/components/features/auth/LoginPromptModal';
import ToastViewport from '@/components/shared/ToastViewport';
import './globals.css';

export const metadata: Metadata = {
  title: 'meeTeam | 3주차 프론트엔드 기반',
  description: 'meeTeam 프론트엔드의 라우팅과 공통 UI 구조',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <AuthSessionBootstrap />
        {children}
        <LoginPromptModal />
        <ToastViewport />
      </body>
    </html>
  );
}
