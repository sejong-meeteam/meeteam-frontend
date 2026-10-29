'use client';

import { ArrowRight, Check, CheckCircle2, ChevronDown, Info, Search, X } from 'lucide-react';
import BaseButton from '@/components/shared/BaseButton';
import BaseInput from '@/components/shared/BaseInput';
import BaseTag from '@/components/shared/BaseTag';
import CategoryBadge from '@/components/shared/CategoryBadge';
import StatusBadge from '@/components/shared/StatusBadge';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SkillChip from '@/components/shared/SkillChip';
import SkeletonBlock from '@/components/shared/SkeletonBlock';

export function ComponentPreview({ id }: { id: string }) {
  switch (id) {
    case 'button':
      return (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <BaseButton size="S">
            시작하기 <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </BaseButton>
          <BaseButton size="S" variant="gray">
            더 알아보기
          </BaseButton>
        </div>
      );
    case 'input':
      return (
        <div className="w-full max-w-60">
          <BaseInput
            inputSize="S"
            placeholder="어떤 팀원을 찾고 있나요?"
            leftIcon={<Search className="h-4 w-4" />}
            tabIndex={-1}
          />
        </div>
      );
    case 'textarea':
      return (
        <div className="w-full max-w-60 rounded-xl border border-mt-border bg-mt-white p-3 text-xs leading-6 text-mt-text-secondary">
          함께 만들고 싶은 프로젝트를
          <br />
          자유롭게 소개해 주세요.<div className="mt-3 text-right text-mt-text-nav">0 / 500</div>
        </div>
      );
    case 'field':
      return (
        <div className="w-full max-w-56 space-y-2">
          <div className="text-xs font-semibold">
            프로젝트 이름 <span className="text-mt-text-secondary">(선택)</span>
          </div>
          <BaseInput inputSize="S" placeholder="새로운 연결의 시작" tabIndex={-1} />
          <p className="text-xs text-mt-text-secondary">
            프로젝트를 잘 나타내는 이름을 지어주세요.
          </p>
        </div>
      );
    case 'dropdown':
      return (
        <div className="w-full max-w-52 space-y-1">
          <div className="flex items-center justify-between rounded-xl border border-mt-border bg-mt-white px-3 py-2 text-xs text-mt-text-secondary">
            함께할 직군 선택
            <ChevronDown className="h-4 w-4" />
          </div>
          <div className="rounded-xl border border-mt-border bg-mt-white p-1 shadow-sm">
            <div className="flex items-center justify-between rounded-lg bg-mt-bg-soft px-2 py-1.5 text-xs text-action-primary">
              프론트엔드
              <Check className="h-3 w-3" />
            </div>
            <div className="px-2 py-1.5 text-xs text-mt-text-secondary">프로덕트 디자인</div>
          </div>
        </div>
      );
    case 'tag':
      return (
        <div className="flex flex-wrap justify-center gap-2">
          <BaseTag size="S" selected leftIcon={<Check className="h-3 w-3" />}>
            사이드 프로젝트
          </BaseTag>
          <BaseTag size="S">스터디</BaseTag>
          <BaseTag size="S">해커톤</BaseTag>
        </div>
      );
    case 'skill-chip':
      return (
        <div className="flex flex-wrap justify-center gap-2">
          <SkillChip label="React" variant="outline" />
          <SkillChip label="TypeScript" variant="outline" />
          <SkillChip label="Figma" variant="outline" />
        </div>
      );
    case 'category-badge':
      return (
        <div className="flex max-w-56 flex-wrap justify-center gap-2">
          {['캡스톤', '창의학기제', '동아리', '기타'].map((label) => (
            <CategoryBadge key={label} label={label} />
          ))}
        </div>
      );
    case 'status-badge':
      return (
        <div className="flex flex-wrap justify-center gap-2">
          <StatusBadge status="open" size="sm" />
          <StatusBadge status="closed" size="sm" />
          <StatusBadge status="leader" size="sm" />
          <StatusBadge status="pending" size="sm" />
        </div>
      );
    case 'avatar':
      return (
        <div className="flex items-center gap-3">
          <ProfileAvatar name="김" sizeClassName="h-10 w-10" />
          <ProfileAvatar
            name="이"
            sizeClassName="h-12 w-12"
            className="bg-mt-category-other-bg text-mt-category-other-text"
          />
          <ProfileAvatar
            name="박"
            sizeClassName="h-14 w-14"
            className="bg-mt-category-club-bg text-mt-category-club-text"
          />
          <ProfileAvatar name="최" sizeClassName="h-10 w-10" />
        </div>
      );
    case 'dialog':
      return (
        <div className="w-full max-w-60 rounded-xl border border-mt-border bg-mt-white p-4 shadow-sm">
          <div className="text-xs font-bold">새로운 팀을 만들어볼까요?</div>
          <p className="mt-1 text-xs text-mt-text-secondary">함께할 팀원을 만날 준비가 됐어요.</p>
          <div className="mt-3 flex justify-end gap-2">
            <span className="rounded-md bg-mt-bg-soft px-3 py-1.5 text-xs text-mt-text-secondary">
              닫기
            </span>
            <span className="rounded-md bg-action-primary px-3 py-1.5 text-xs text-mt-white">
              만들기
            </span>
          </div>
        </div>
      );
    case 'toast':
      return (
        <div className="flex w-full max-w-64 items-center gap-2 rounded-xl border border-mt-border bg-mt-white px-3 py-3 shadow-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-mt-mint" />
          <span className="flex-1 text-xs text-mt-text-secondary">변경 사항을 저장했어요.</span>
          <X className="h-3 w-3 text-mt-text-secondary" />
        </div>
      );
    case 'skeleton':
      return (
        <div className="flex w-full max-w-56 items-center gap-3">
          <SkeletonBlock className="h-12 w-12 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-3 w-3/4" />
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-1/2" />
          </div>
        </div>
      );
    default:
      return <Info className="h-8 w-8 text-mt-primary" />;
  }
}
