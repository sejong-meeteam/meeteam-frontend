import RequireAuth from '@/components/features/auth/RequireAuth';
import ProjectManageGithub from '@/components/features/project/github/ProjectManageGithub';

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <RequireAuth>
      <ProjectManageGithub projectId={projectId} />
    </RequireAuth>
  );
}
