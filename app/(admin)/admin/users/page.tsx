import type { Metadata } from 'next';
import { Suspense } from 'react';
import AdminUserListPage from '@/components/features/admin/users/AdminUserListPage';

export const metadata: Metadata = { title: '사용자 관리' };

export default function Page() {
  return (
    <Suspense>
      <AdminUserListPage />
    </Suspense>
  );
}
