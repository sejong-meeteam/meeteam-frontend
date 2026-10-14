import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import BaseDropdown from '@/components/shared/BaseDropdown';
import BaseField from '@/components/shared/BaseField';
import BaseInput from '@/components/shared/BaseInput';
import BaseTag from '@/components/shared/BaseTag';
import BaseTextarea from '@/components/shared/BaseTextarea';

const meta = {
  title: '공통 UI/입력과 선택',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextFields: Story = {
  name: '입력창과 안내 문구',
  render: () => (
    <div className="w-full max-w-md space-y-5">
      <BaseField
        label="프로젝트 이름"
        htmlFor="storybook-name"
        hintText="화면 내부의 입력 상태입니다."
      >
        <BaseInput id="storybook-name" placeholder="이름을 입력하세요" />
      </BaseField>
      <BaseField label="소개" htmlFor="storybook-description" required={false}>
        <BaseTextarea id="storybook-description" placeholder="소개를 입력하세요" />
      </BaseField>
    </div>
  ),
};

export const ErrorState: Story = {
  name: '입력 오류 표시',
  render: () => (
    <div className="w-full max-w-md">
      <BaseField label="프로젝트 이름" htmlFor="storybook-error" errorText="필수 항목입니다.">
        <BaseInput id="storybook-error" error placeholder="이름을 입력하세요" />
      </BaseField>
    </div>
  ),
};

function DropdownExample() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  return (
    <div className="w-full max-w-md">
      <BaseDropdown
        value={value}
        placeholder="직군을 선택하세요"
        items={['프론트엔드', '백엔드', '디자인']}
        open={open}
        onToggle={() => setOpen((current) => !current)}
        onSelect={(item) => {
          setValue(item);
          setOpen(false);
        }}
        buttonClassName="items-center justify-between bg-mt-white px-4 py-3"
      />
    </div>
  );
}

export const Dropdown: Story = { name: '드롭다운', render: () => <DropdownExample /> };

export const Tags: Story = {
  name: '태그 상태',
  render: () => (
    <div className="flex flex-wrap gap-2">
      <BaseTag size="S" selected>
        선택됨
      </BaseTag>
      <BaseTag size="S">기본</BaseTag>
      <BaseTag size="M">중간 크기</BaseTag>
    </div>
  ),
};
