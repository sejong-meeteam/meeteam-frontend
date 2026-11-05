'use client';

import type { ReactNode } from 'react';

import { useId, useState } from 'react';
import BaseInput from '@/components/shared/BaseInput';
import BaseTextarea from '@/components/shared/BaseTextarea';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { getAdminErrorMessage } from './format';
import { ADMIN_REASON_MAX_LENGTH, adminReasonSchema } from './schema';

type AdminActionModalProps = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  confirmText?: string;
  reasonPlaceholder?: string;
  children?: ReactNode;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
};

export default function AdminActionModal({
  title,
  description,
  confirmLabel,
  tone = 'primary',
  confirmText,
  reasonPlaceholder = '조치 사유를 입력해 주세요. 감사 로그에 기록됩니다.',
  children,
  onClose,
  onSubmit,
}: AdminActionModalProps) {
  const reasonId = useId();
  const reasonErrorId = useId();
  const confirmId = useId();
  const [reason, setReason] = useState('');
  const [typedConfirm, setTypedConfirm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isConfirmMatched = !confirmText || typedConfirm.trim() === confirmText;

  const handleConfirm = async () => {
    const parsed = adminReasonSchema.safeParse(reason);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? '사유를 확인해 주세요.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit(parsed.data);
    } catch (error) {
      setErrorMessage(getAdminErrorMessage(error));
      setIsSubmitting(false);
    }
  };

  return (
    <ConfirmModal
      isOpen
      title={title}
      description={description}
      confirmLabel={isSubmitting ? '처리 중...' : confirmLabel}
      confirmTone={tone}
      closeLabel="취소"
      isSubmitting={isSubmitting}
      isConfirmDisabled={!isConfirmMatched}
      confirmButtonDataCy="admin-action-confirm"
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      <div className="flex flex-col gap-4">
        {children}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor={reasonId} className="text-sm font-bold text-mt-text-primary">
              조치 사유 <span className="text-mt-danger">*</span>
            </label>
            <span className="text-xs text-mt-text-secondary">
              {reason.trim().length}/{ADMIN_REASON_MAX_LENGTH}
            </span>
          </div>
          <BaseTextarea
            id={reasonId}
            rows={3}
            maxLength={ADMIN_REASON_MAX_LENGTH}
            value={reason}
            placeholder={reasonPlaceholder}
            aria-invalid={Boolean(errorMessage) || undefined}
            aria-describedby={errorMessage ? reasonErrorId : undefined}
            data-cy="admin-action-reason"
            onChange={(event) => {
              setReason(event.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
          />
        </div>

        {confirmText ? (
          <div>
            <label htmlFor={confirmId} className="mb-1.5 block text-sm text-mt-text-secondary">
              확인을 위해 <strong className="text-mt-text-primary">{confirmText}</strong>을(를)
              입력해 주세요.
            </label>
            <BaseInput
              id={confirmId}
              inputSize="S"
              value={typedConfirm}
              autoComplete="off"
              data-cy="admin-action-confirm-text"
              onChange={(event) => setTypedConfirm(event.target.value)}
            />
          </div>
        ) : null}

        {errorMessage ? (
          <p
            id={reasonErrorId}
            role="alert"
            className="rounded-xl bg-mt-danger-soft px-3 py-2 text-sm text-mt-danger"
          >
            {errorMessage}
          </p>
        ) : null}
      </div>
    </ConfirmModal>
  );
}
