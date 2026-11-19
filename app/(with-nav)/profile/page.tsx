import RequireAuth from '@/components/features/auth/RequireAuth';
import ProfileOverview from '@/components/features/profile/ProfileOverview';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string | string[] }>;
}) {
  const { edit } = await searchParams;

  return (
    <RequireAuth>
      <ProfileOverview initialEditing={edit === '1'} />
    </RequireAuth>
  );
}
