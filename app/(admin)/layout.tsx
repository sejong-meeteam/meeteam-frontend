import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AdminShell from '@/components/features/admin/AdminShell';
import RequireAdmin from '@/components/features/admin/RequireAdmin';

export const metadata: Metadata = {
  title: {
    default: '관리자',
    template: '%s | 미팀 관리자',
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAdmin>
      <AdminShell>{children}</AdminShell>
    </RequireAdmin>
  );
}
