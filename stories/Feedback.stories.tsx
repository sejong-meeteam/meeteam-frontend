import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import BaseButton from '@/components/shared/BaseButton';
import BaseModal from '@/components/shared/BaseModal';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import { useToastStore } from '@/stores/useToastStore';

const meta = { title: '공통 UI/모달과 피드백', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function ModalExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <BaseButton onClick={() => setOpen(true)}>모달 열기</BaseButton>
      <BaseModal isOpen={open} onClose={() => setOpen(false)}>
        <div className="space-y-4 rounded-2xl bg-mt-white p-6">
          <h2 className="text-xl font-bold">공통 모달</h2>
          <p className="text-mt-text-secondary">열림, 닫기, ESC 동작을 확인합니다.</p>
          <BaseButton onClick={() => setOpen(false)}>닫기</BaseButton>
        </div>
      </BaseModal>
    </>
  );
}

function ToastExample() {
  const showToast = useToastStore((state) => state.showToast);
  return (
    <div className="flex gap-2">
      <BaseButton onClick={() => showToast({ tone: 'success', message: '성공 안내 예시입니다.' })}>
        성공
      </BaseButton>
      <BaseButton
        variant="gray"
        onClick={() => showToast({ tone: 'error', message: '오류 안내 예시입니다.' })}
      >
        오류
      </BaseButton>
    </div>
  );
}

export const Modal: Story = { render: () => <ModalExample /> };
export const Toast: Story = { render: () => <ToastExample /> };
export const Skeleton: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-3 rounded-xl bg-mt-bg-soft p-4">
      <SkeletonBlock className="h-5 w-1/3" />
      <SkeletonBlock className="h-10 w-full" />
      <SkeletonBlock className="h-10 w-4/5" />
    </div>
  ),
};
