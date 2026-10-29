import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import CategoryBadge from '@/components/shared/CategoryBadge';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SkillChip from '@/components/shared/SkillChip';

const meta = {
  id: 'shared-display',
  title: '공통 UI/정보 표시',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Categories: Story = {
  name: '프로젝트 카테고리',
  render: () => (
    <div className="flex flex-wrap gap-3">
      {['캡스톤', '창의학기제', '동아리', '기타'].map((label) => (
        <CategoryBadge key={label} label={label} />
      ))}
    </div>
  ),
};

export const Skills: Story = {
  name: '기술 스택 칩',
  render: () => (
    <div className="flex flex-wrap gap-3">
      <SkillChip label="React" variant="primary" />
      <SkillChip label="TypeScript" variant="neutral" />
      <SkillChip label="Figma" variant="outline" />
    </div>
  ),
};

export const Avatars: Story = {
  name: '프로필 아바타',
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex items-center gap-2">
        <ProfileAvatar name="김미팀" />
        <span>김미팀</span>
      </div>
      <div className="flex items-center gap-2">
        <ProfileAvatar name="이팀원" shape="rounded" sizeClassName="h-12 w-12" />
        <span>이팀원</span>
      </div>
    </div>
  ),
};
