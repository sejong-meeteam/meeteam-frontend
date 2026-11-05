'use client';

import type { ReactNode } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, FolderKanban, LayoutDashboard, Menu, ScrollText, Users, X } from 'lucide-react';
import { useState } from 'react';
import AppLogo from '@/components/shared/AppLogo';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import { useAuthStore } from '@/stores/useAuthStore';

const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/users', label: '사용자 관리', icon: Users },
  { href: '/admin/projects', label: '프로젝트 관리', icon: FolderKanban },
  { href: '/admin/audit-logs', label: '감사 로그', icon: ScrollText },
] as const;

export default function AdminShell({ children }: { children: ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-mt-border bg-mt-white lg:block">
        <AdminSidebar />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-mt-border bg-mt-white px-4 lg:hidden">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-mt-text-nav hover:bg-mt-bg-soft"
          aria-label="관리자 메뉴 열기"
          aria-expanded={isDrawerOpen}
          onClick={() => setIsDrawerOpen(true)}
        >
          <Menu className="h-5 w-5" aria-hidden strokeWidth={1.8} />
        </button>
        <AppLogo className="h-7 w-28" />
        <AdminLabel />
      </header>

      {isDrawerOpen ? (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="관리자 메뉴"
        >
          <button
            type="button"
            className="absolute inset-0 bg-mt-text-primary/40"
            aria-label="관리자 메뉴 닫기"
            onClick={() => setIsDrawerOpen(false)}
          />
          <aside className="relative h-full w-72 max-w-[85%] bg-mt-white shadow-2xl">
            <button
              type="button"
              className="absolute top-4 right-3 flex h-8 w-8 items-center justify-center rounded-lg text-mt-text-secondary hover:bg-mt-bg-soft"
              aria-label="관리자 메뉴 닫기"
              onClick={() => setIsDrawerOpen(false)}
            >
              <X className="h-4 w-4" aria-hidden strokeWidth={2} />
            </button>
            <AdminSidebar onNavigate={() => setIsDrawerOpen(false)} />
          </aside>
        </div>
      ) : null}

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:py-8 lg:px-8">{children}</div>
      </main>
    </div>
  );
}

function AdminLabel() {
  return (
    <span className="rounded-md bg-mt-badge-bg px-2 py-0.5 text-xs leading-4 font-bold text-action-primary">
      Admin
    </span>
  );
}

function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const name = useAuthStore((state) => state.name);
  const email = useAuthStore((state) => state.email);

  const isActive = (href: string) =>
    href === '/admin' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-5">
        <Link href="/admin" onClick={onNavigate} aria-label="관리자 대시보드">
          <AppLogo className="h-7 w-28" />
        </Link>
        <AdminLabel />
      </div>

      <nav aria-label="관리자 메뉴" className="flex-1 px-3 py-4">
        <ul className="flex flex-col gap-1">
          {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-mt-badge-bg text-action-primary'
                      : 'text-mt-text-nav hover:bg-mt-bg-soft hover:text-mt-text-primary'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden strokeWidth={active ? 2 : 1.8} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-mt-border p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <ProfileAvatar name={name ?? '관리자'} sizeClassName="h-9 w-9" textClassName="text-sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-mt-text-primary">{name ?? '관리자'}</p>
            <p className="truncate text-xs text-mt-text-secondary">{email}</p>
          </div>
        </div>
        <Link
          href="/"
          onClick={onNavigate}
          className="mt-1 flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-mt-text-nav transition-colors hover:bg-mt-bg-soft hover:text-mt-text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden strokeWidth={1.8} />
          서비스로 돌아가기
        </Link>
      </div>
    </div>
  );
}
