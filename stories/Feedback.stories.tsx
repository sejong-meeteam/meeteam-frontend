import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import BaseButton from '@/components/shared/BaseButton';
import BaseModal from '@/components/shared/BaseModal';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import { useToastStore } from '@/stores/useToastStore';
import ConfirmModal from '@/components/shared/ConfirmModal';

const meta = {
  id: 'shared-feedback',
  title: '공통 UI/모달과 피드백',
  tags: ['autodocs'],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function ModalExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <BaseButton onClick={() => setOpen(true)}>모달 열기</BaseButton>
      <BaseModal isOpen={open} onClose={() => setOpen(false)} ariaLabel="공통 모달">
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

function ConfirmExample({ busy = false }: { busy?: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  return (
    <>
      <BaseButton onClick={() => setOpen(true)}>삭제 확인 열기</BaseButton>
      {confirmed ? <p role="status">삭제가 완료되었습니다.</p> : null}
      <ConfirmModal
        isOpen={open}
        title="프로젝트를 삭제할까요?"
        description="삭제한 프로젝트는 복구할 수 없습니다."
        confirmLabel={busy ? '삭제 중' : '삭제하기'}
        isSubmitting={busy}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          setConfirmed(true);
          setOpen(false);
        }}
      />
    </>
  );
}
export const Confirmation: Story = { render: () => <ConfirmExample /> };
export const Submitting: Story = { render: () => <ConfirmExample busy /> };
export const Empty: Story = {
  render: () => (
    <section aria-label="빈 목록" className="rounded-xl bg-white p-6">
      <h2 className="text-xl font-bold">등록된 항목이 없습니다.</h2>
      <p>새로운 프로젝트를 등록해 보세요.</p>
    </section>
  ),
};
