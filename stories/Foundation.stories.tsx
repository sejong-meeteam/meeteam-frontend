import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import AppLogo from '@/components/shared/AppLogo';
import StatusBadge from '@/components/shared/StatusBadge';

const meta = {
  id: 'foundation',
  title: '기반/디자인 토큰과 상태',
  tags: ['autodocs'],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Brand: Story = {
  render: () => (
    <section aria-label="브랜드">
      <AppLogo className="h-10 w-40" />
      <h1 className="mt-4 text-2xl font-bold">함께 만드는 meeTeam</h1>
      <p className="text-text-gray">팀원을 찾고 프로젝트를 시작하세요.</p>
    </section>
  ),
};
export const Status: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(['open', 'closed', 'suspended', 'completed', 'pending', 'leader'] as const).map(
        (status) => (
          <StatusBadge key={status} status={status} />
        ),
      )}
    </div>
  ),
};
