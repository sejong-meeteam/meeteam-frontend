'use client';

import { lazy, Suspense } from 'react';
import { LoaderCircle } from 'lucide-react';
import BaseModal from './BaseModal';
import BaseButton from './BaseButton';
import type { ImageCropModalProps } from '@/types/image';

const ImageCropDialog = lazy(() => import('./ImageCropDialog'));

export default function ImageCropModal(props: ImageCropModalProps) {
  if (!props.isOpen || !props.file) return null;

  return (
    <Suspense
      fallback={
        <BaseModal isOpen onClose={props.onClose} ariaLabel={props.title}>
          <div className="space-y-5 rounded-2xl bg-mt-white p-6 shadow-2xl">
            <p role="status" className="flex items-center gap-2 text-sm text-mt-text-secondary">
              <LoaderCircle
                className="h-4 w-4 animate-spin motion-reduce:animate-none"
                aria-hidden
              />
              이미지 편집기를 불러오고 있어요.
            </p>
            <BaseButton variant="gray" onClick={props.onClose}>
              취소
            </BaseButton>
          </div>
        </BaseModal>
      }
    >
      <ImageCropDialog {...props} />
    </Suspense>
  );
}
