import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AdminUserDetailPage from '@/components/features/admin/users/AdminUserDetailPage';

export const metadata: Metadata = { title: '회원 상세' };

export default async function Page({ params }: { params: Promise<{ memberId: string }> }) {
  const memberId = Number((await params).memberId);
  if (!Number.isInteger(memberId) || memberId <= 0) notFound();

  return <AdminUserDetailPage memberId={memberId} />;
}
