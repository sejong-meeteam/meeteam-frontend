import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import HomeOverview from '@/components/features/home/HomeOverview';
import PlannedPage from '@/components/features/home/PlannedPage';
import UiShowcase from '@/components/features/home/UiShowcase';

const meta = {
  title: '3주차/화면 구조',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {
  name: '홈과 공통 레이아웃',
  render: () => <HomeOverview />,
};

export const SharedUi: Story = {
  name: '공통 UI 쇼케이스',
  render: () => <UiShowcase />,
};

export const PublicRoute: Story = {
  name: '공개 경로',
  render: () => <PlannedPage title="프로젝트 찾기" />,
};

export const AuthRoute: Story = {
  name: '인증 필요 경로',
  render: () => <PlannedPage title="내 프로필" />,
};
