'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import BaseButton from '@/components/shared/BaseButton';
import BaseDropdown from '@/components/shared/BaseDropdown';
import BaseField from '@/components/shared/BaseField';
import BaseInput from '@/components/shared/BaseInput';
import BaseModal from '@/components/shared/BaseModal';
import BaseTag from '@/components/shared/BaseTag';
import BaseTextarea from '@/components/shared/BaseTextarea';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import { useToastStore } from '@/stores/useToastStore';

const JOB_OPTIONS = ['프론트엔드', '백엔드', '디자인'];

export default function UiShowcase() {
  const [selectedJob, setSelectedJob] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(['React']);
  const showToast = useToastStore((state) => state.showToast);

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="rounded-3xl border border-mt-border bg-mt-white p-6 sm:p-8">
        <p className="text-sm font-bold text-mt-primary">3주차 · 공통 UI</p>
        <h1 className="mt-2 text-3xl font-bold">컴포넌트 쇼케이스</h1>
        <p className="mt-3 text-mt-text-secondary">
          이번 주에 마련한 공통 컴포넌트의 모양과 기본 상호작용을 확인할 수 있습니다. 아래 입력값은
          저장되지 않습니다.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-5 rounded-2xl border border-mt-border bg-mt-white p-6">
          <h2 className="text-xl font-bold">버튼</h2>
          <div className="flex flex-wrap items-center gap-3">
            <BaseButton
              size="L"
              onClick={() => showToast({ tone: 'success', message: '공통 버튼을 클릭했습니다.' })}
            >
              기본 버튼
            </BaseButton>
            <BaseButton variant="gray" onClick={() => setModalOpen(true)}>
              모달 열기
            </BaseButton>
            <BaseButton disabled>비활성 버튼</BaseButton>
          </div>
          <p className="text-sm text-mt-text-secondary">
            크기와 강조 수준을 공통 속성으로 지정합니다.
          </p>
        </section>

        <section className="space-y-5 rounded-2xl border border-mt-border bg-mt-white p-6">
          <h2 className="text-xl font-bold">태그</h2>
          <div className="flex flex-wrap gap-2">
            {['React', 'TypeScript', 'Next.js'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={selectedTags.includes(tag)}
              >
                <BaseTag size="S" selected={selectedTags.includes(tag)}>
                  {tag}
                </BaseTag>
              </button>
            ))}
          </div>
          <p className="text-sm text-mt-text-secondary">선택 상태를 화면 내부에서 관리합니다.</p>
        </section>

        <section className="space-y-5 rounded-2xl border border-mt-border bg-mt-white p-6">
          <h2 className="text-xl font-bold">입력창과 드롭다운</h2>
          <BaseField
            label="프로젝트 이름"
            htmlFor="showcase-name"
            hintText="입력한 내용은 서버로 전송되지 않습니다."
          >
            <BaseInput id="showcase-name" placeholder="프로젝트 이름을 입력하세요" />
          </BaseField>
          <BaseField label="소개" htmlFor="showcase-intro" required={false}>
            <BaseTextarea id="showcase-intro" placeholder="프로젝트를 간단히 소개하세요" />
          </BaseField>
          <div className="space-y-2">
            <p className="text-lg font-bold">관심 직군</p>
            <BaseDropdown
              value={selectedJob}
              placeholder="직군을 선택하세요"
              items={JOB_OPTIONS}
              open={dropdownOpen}
              onToggle={() => setDropdownOpen((open) => !open)}
              onSelect={(value) => {
                setSelectedJob(value);
                setDropdownOpen(false);
              }}
              buttonClassName="items-center justify-between bg-mt-white px-4 py-3"
            />
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border border-mt-border bg-mt-white p-6">
          <h2 className="text-xl font-bold">로딩과 피드백</h2>
          <div className="space-y-3 rounded-xl bg-mt-bg-soft p-4" aria-label="스켈레톤 미리보기">
            <SkeletonBlock className="h-5 w-1/3" />
            <SkeletonBlock className="h-10 w-full" />
            <SkeletonBlock className="h-10 w-4/5" />
          </div>
          <div className="flex flex-wrap gap-2">
            <BaseButton
              size="S"
              onClick={() => showToast({ tone: 'success', message: '저장 완료 예시입니다.' })}
            >
              성공 토스트
            </BaseButton>
            <BaseButton
              size="S"
              variant="gray"
              onClick={() => showToast({ tone: 'error', message: '오류 안내 예시입니다.' })}
            >
              오류 토스트
            </BaseButton>
          </div>
        </section>
      </div>

      <BaseModal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="space-y-5 rounded-2xl bg-mt-white p-6 shadow-lg">
          <div className="flex items-center gap-2 text-mt-primary">
            <ChevronDown className="h-5 w-5" />
            <h2 className="text-xl font-bold text-mt-text-primary">공통 모달</h2>
          </div>
          <p className="text-mt-text-secondary">
            모달의 열림 상태와 닫기 동작을 확인할 수 있습니다.
          </p>
          <BaseButton onClick={() => setModalOpen(false)}>확인</BaseButton>
        </div>
      </BaseModal>
    </div>
  );
}
