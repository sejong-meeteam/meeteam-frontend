'use client';

import type { ReactNode } from 'react';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import RequireAuth from '@/components/features/auth/RequireAuth';
import { useAuthStore } from '@/stores/useAuthStore';

type RequireAdminProps = {
  children: ReactNode;
};

export default function RequireAdmin({ children }: RequireAdminProps) {
  return (
    <div className="min-h-screen bg-mt-bg-soft text-mt-text-primary">
      <RequireAuth>
        <AdminRoleGate>{children}</AdminRoleGate>
      </RequireAuth>
    </div>
  );
}

function AdminRoleGate({ children }: RequireAdminProps) {
  const role = useAuthStore((state) => state.role);

  if (role !== 'ADMIN') {
    return <AdminForbidden />;
  }

  return <>{children}</>;
}

function AdminForbidden() {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-lg items-center px-4 py-16">
      <div className="w-full rounded-3xl border border-mt-border bg-mt-white px-6 py-10 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mt-danger-soft text-mt-danger">
          <ShieldAlert className="h-6 w-6" aria-hidden strokeWidth={1.8} />
        </span>
        <h1 className="mt-4 text-xl leading-7 font-extrabold">관리자만 접근할 수 있어요</h1>
        <p className="mt-2 text-sm leading-6 text-mt-text-secondary">
          관리자 권한이 있는 계정으로 로그인한 뒤 다시 시도해 주세요.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-mt-border bg-mt-white px-5 text-sm font-bold text-mt-text-secondary transition-colors hover:bg-mt-bg-soft hover:text-mt-text-primary"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </section>
  );
}
