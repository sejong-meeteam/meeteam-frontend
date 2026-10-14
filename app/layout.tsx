import type { Metadata } from 'next';
import AuthSessionBootstrap from '@/components/features/auth/AuthSessionBootstrap';
import LoginPromptModal from '@/components/features/auth/LoginPromptModal';
import ToastViewport from '@/components/shared/ToastViewport';
import './globals.css';

export const metadata: Metadata = {
  title: 'meeTeam',
  description: '대학생 팀빌딩 플랫폼 meeTeam',
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
