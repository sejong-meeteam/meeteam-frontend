import Link from 'next/link';
import { ArrowRight, Layers3, LayoutTemplate, PanelsTopLeft } from 'lucide-react';
import BaseTag from '@/components/shared/BaseTag';

const AREAS = [
  {
    href: '/projects',
    title: '프로젝트',
    description: '목록, 상세, 등록, 관리 경로를 구성했습니다.',
  },
  {
    href: '/profile',
    title: '프로필',
    description: '내 프로필과 공개 프로필 경로를 구분했습니다.',
  },
  { href: '/teammates', title: '팀원 찾기', description: '탐색 화면의 코드 위치를 마련했습니다.' },
  {
    href: '/notifications',
    title: '알림',
    description: '공통 내비게이션 아래에 경로를 배치했습니다.',
  },
];

export default function HomeOverview() {
  return (
    <div className="space-y-10 pb-12">
      <section className="rounded-3xl border border-mt-border bg-mt-white p-8 sm:p-12">
        <BaseTag size="S">3주차 프론트엔드 기반</BaseTag>
        <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">
          함께할 팀을 찾는 공간,
          <br />
          <span className="text-mt-primary">meeTeam</span>
        </h1>
        <p className="mt-4 max-w-2xl text-mt-text-secondary">
          서비스의 경로, 공통 레이아웃, UI와 상태 관리 구조를 마련했습니다. 각 기능 화면과 서버
          연동은 이후 주차에 이어집니다.
        </p>
        <Link
          href="/projects"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-mt-primary px-5 py-3 text-sm font-bold text-mt-white"
        >
          페이지 구조 살펴보기 <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <PanelsTopLeft className="h-6 w-6 text-mt-primary" />
          <h2 className="text-2xl font-bold">구성된 화면 경로</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AREAS.map((area) => (
            <Link
              key={area.href}
              href={area.href}
              className="rounded-2xl border border-mt-border bg-mt-white p-5 transition-colors hover:bg-mt-bg-soft"
            >
              <h3 className="font-bold">{area.title}</h3>
              <p className="mt-2 text-sm leading-6 text-mt-text-secondary">{area.description}</p>
              <ArrowRight className="mt-6 h-4 w-4 text-mt-primary" />
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-mt-bg-soft p-6">
          <LayoutTemplate className="h-6 w-6 text-mt-primary" />
          <h2 className="mt-3 font-bold">공통 UI</h2>
          <p className="mt-2 text-sm text-mt-text-secondary">
            버튼, 입력창, 드롭다운, 모달, 태그, 스켈레톤을 shared에 배치했습니다.
          </p>
        </div>
        <div className="rounded-2xl bg-mt-bg-soft p-6">
          <Layers3 className="h-6 w-6 text-mt-primary" />
          <h2 className="mt-3 font-bold">책임 분리</h2>
          <p className="mt-2 text-sm text-mt-text-secondary">
            app은 라우팅, features는 도메인 UI, stores는 공유 상태를 담당합니다.
          </p>
        </div>
      </section>
    </div>
  );
}
