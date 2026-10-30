'use client';

import { useState } from 'react';
import { ArrowUpRight, Box, Code2, ExternalLink, Search } from 'lucide-react';
import {
  COMPONENTS,
  COMPONENT_CATEGORIES,
  CATEGORY_LABELS,
  FOUNDATIONS,
  type ComponentCategory,
} from './catalog';
import { ComponentPreview } from './ComponentPreview';
import { matchesQuery } from './search';

export function ComponentOverview({
  query,
  onClearSearch,
}: {
  query: string;
  onClearSearch: () => void;
}) {
  const [category, setCategory] = useState<ComponentCategory | 'all'>('all');
  const searchResults = COMPONENTS.filter((item) =>
    matchesQuery(
      query,
      item.name,
      item.koreanName,
      item.description,
      item.source,
      CATEGORY_LABELS[item.category],
    ),
  );
  const filtered = searchResults.filter((item) => category === 'all' || item.category === category);

  return (
    <>
      {!query && (
        <>
          <section
            className="grid grid-cols-2 gap-3 xl:grid-cols-4"
            aria-label="파운데이션 바로가기"
          >
            {FOUNDATIONS.map((foundation) => (
              <a
                key={foundation.id}
                href={`#${foundation.id}`}
                className="group flex items-center justify-between gap-2 rounded-xl border border-mt-border bg-mt-white p-4 transition-colors hover:bg-mt-bg-soft focus-visible:outline-2 focus-visible:outline-action-primary"
              >
                <div>
                  <p className="text-xs font-semibold">{foundation.name}</p>
                  <p className="mt-1 text-xs leading-5 text-mt-text-secondary">
                    {foundation.koreanName}
                  </p>
                </div>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-mt-text-nav transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </a>
            ))}
          </section>
        </>
      )}
      <section className="mt-12" aria-labelledby="component-list-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 id="component-list-heading" className="text-xl font-bold tracking-tight">
                {query ? '검색 결과' : '모든 컴포넌트'}
              </h2>
              <span className="rounded-md bg-mt-bg-soft px-2 py-0.5 font-mono text-xs text-mt-text-secondary">
                {filtered.length}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-mt-text-secondary">
              {query
                ? `“${query}”에 해당하는 컴포넌트입니다.`
                : '미리보고, 직접 조작하고, 우리 제품에 적용해 보세요.'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-mt-text-secondary">
            <Box className="h-3.5 w-3.5" aria-hidden />
            실제 서비스 컴포넌트
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="컴포넌트 카테고리">
          {(['all', ...COMPONENT_CATEGORIES] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary ${category === item ? 'border-action-primary bg-action-primary text-mt-white' : 'border-mt-border bg-mt-white text-mt-text-secondary hover:bg-mt-bg-soft'}`}
            >
              {item === 'all' ? '전체' : CATEGORY_LABELS[item]}
              <span className="ml-1.5 opacity-70">
                {searchResults.filter((entry) => item === 'all' || entry.category === item).length}
              </span>
            </button>
          ))}
        </div>
        {filtered.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((component) => (
              <a
                key={component.id}
                href={`#${component.id}`}
                className="group min-w-0 overflow-hidden rounded-2xl border border-mt-border bg-mt-white transition-all duration-200 hover:-translate-y-0.5 hover:border-mt-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-action-primary"
              >
                <div
                  className="flex h-44 items-center justify-center border-b border-mt-border bg-mt-bg-soft/60 px-5"
                  aria-hidden
                  inert
                >
                  <ComponentPreview id={component.id} />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold tracking-tight">{component.name}</h3>
                    <ArrowUpRight
                      className="h-4 w-4 text-mt-text-nav transition-colors group-hover:text-action-primary"
                      aria-hidden
                    />
                  </div>
                  <p className="mt-2 min-h-10 text-xs leading-5 text-mt-text-secondary">
                    {component.description}
                  </p>
                  <p className="mt-4 text-xs text-mt-text-nav">
                    {CATEGORY_LABELS[component.category]}
                    <span className="mx-2 text-mt-border">/</span>
                    {component.koreanName}
                  </p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-mt-border px-6 py-16 text-center">
            <Search className="mx-auto h-7 w-7 text-mt-text-nav" aria-hidden />
            <h3 className="mt-4 text-sm font-semibold">일치하는 컴포넌트가 없어요.</h3>
            <p className="mt-2 text-sm text-mt-text-secondary">
              다른 검색어나 카테고리로 다시 찾아보세요.
            </p>
            <button
              type="button"
              onClick={() => {
                setCategory('all');
                onClearSearch();
              }}
              className="mt-5 rounded-lg border border-mt-border px-4 py-2 text-xs font-semibold text-action-primary focus-visible:outline-2 focus-visible:outline-action-primary"
            >
              필터 초기화
            </button>
          </div>
        )}
      </section>
      <section className="mt-12 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-mt-border bg-mt-bg-soft/50 p-6">
        <div className="flex gap-3">
          <Code2 className="mt-0.5 h-5 w-5 shrink-0 text-action-primary" aria-hidden />
          <div>
            <h2 className="text-sm font-semibold">코드에서 시작하는 디자인 시스템</h2>
            <p className="mt-2 text-xs leading-6 text-mt-text-secondary">
              이 페이지의 예시는 components/shared의 실제 컴포넌트를 사용합니다.
            </p>
          </div>
        </div>
        <a
          href="/storybook/index.html"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-mt-border bg-mt-white px-3 py-2 text-xs font-semibold text-mt-text-secondary focus-visible:outline-2 focus-visible:outline-action-primary"
        >
          Storybook
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      </section>
    </>
  );
}
