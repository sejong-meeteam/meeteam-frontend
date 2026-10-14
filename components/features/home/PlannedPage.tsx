import Link from 'next/link';
import BaseTag from '@/components/shared/BaseTag';
import SkeletonBlock from '@/components/shared/SkeletonBlock';

type PlannedPageProps = {
  title: string;
  description: string;
  access?: '공개' | '인증 필요';
};

export default function PlannedPage({ title, description, access = '공개' }: PlannedPageProps) {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl border border-mt-border bg-mt-white p-6 sm:p-10">
      <div className="flex flex-wrap gap-2">
        <BaseTag size="S">{access}</BaseTag>
        <BaseTag size="S">화면 준비 중</BaseTag>
      </div>
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-3 leading-7 text-mt-text-secondary">{description}</p>
      </div>
      <div className="space-y-3 rounded-2xl bg-mt-bg-soft p-5">
        <SkeletonBlock className="h-5 w-1/3" />
        <SkeletonBlock className="h-12 w-full" />
        <SkeletonBlock className="h-12 w-4/5" />
      </div>
      <p className="text-sm text-mt-text-secondary">
        현재는 경로와 공통 화면 구조만 마련되어 있습니다. 실제 데이터와 기능은 다음 구현 단계에서
        연결합니다.
      </p>
      <Link
        href="/"
        className="inline-flex rounded-xl border border-mt-border px-4 py-2 text-sm font-semibold text-mt-primary"
      >
        홈으로 돌아가기
      </Link>
    </section>
  );
}
