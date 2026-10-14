import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import BaseButton from '@/components/shared/BaseButton';

const meta = {
  title: '공통 UI/버튼',
  component: BaseButton,
  tags: ['autodocs'],
  args: { children: '기본 버튼', size: 'M', variant: 'primary', disabled: false },
  argTypes: {
    size: { control: 'select', options: ['XL', 'L', 'M', 'S', 'XS'] },
    variant: { control: 'select', options: ['primary', 'gray'] },
  },
} satisfies Meta<typeof BaseButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { children: '보조 버튼', variant: 'gray' } };
export const Disabled: Story = { args: { children: '비활성 버튼', disabled: true } };
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {(['XL', 'L', 'M', 'S', 'XS'] as const).map((size) => (
        <BaseButton key={size} size={size}>
          {size}
        </BaseButton>
      ))}
    </div>
  ),
};
