import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AdminProjectDetailPage from '@/components/features/admin/projects/AdminProjectDetailPage';

export const metadata: Metadata = { title: '프로젝트 상세' };

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const projectId = Number((await params).projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();

  return <AdminProjectDetailPage projectId={projectId} />;
}
