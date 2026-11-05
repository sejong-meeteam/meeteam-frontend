import type { Metadata } from 'next';
import { Suspense } from 'react';
import AdminAuditLogPage from '@/components/features/admin/audit/AdminAuditLogPage';

export const metadata: Metadata = { title: '감사 로그' };

export default function Page() {
  return (
    <Suspense>
      <AdminAuditLogPage />
    </Suspense>
  );
}
