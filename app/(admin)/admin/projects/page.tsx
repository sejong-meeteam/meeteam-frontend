import type { Metadata } from 'next';
import { Suspense } from 'react';
import AdminProjectListPage from '@/components/features/admin/projects/AdminProjectListPage';

export const metadata: Metadata = { title: '프로젝트 관리' };

export default function Page() {
  return (
    <Suspense>
      <AdminProjectListPage />
    </Suspense>
  );
}
