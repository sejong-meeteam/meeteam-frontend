import type { Metadata } from 'next';
import AdminDashboardPage from '@/components/features/admin/dashboard/AdminDashboardPage';

export const metadata: Metadata = { title: '대시보드' };

export default function Page() {
  return <AdminDashboardPage />;
}
