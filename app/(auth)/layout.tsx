import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mt-bg-soft px-4 py-8 sm:px-6">
      {children}
    </main>
  );
}
