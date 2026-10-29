import type { Metadata } from 'next';
import DesignSystemPage from '@/components/features/design-system/DesignSystemPage';

export const metadata: Metadata = {
  title: 'Design System',
  description: 'meeTeam의 디자인 토큰, 공통 컴포넌트와 사용 가이드를 살펴보세요.',
  alternates: { canonical: '/design-system' },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <DesignSystemPage />;
}
