'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Box,
  Check,
  ChevronRight,
  Code2,
  ExternalLink,
  Layers,
  Menu,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import AppLogo from '@/components/shared/AppLogo';
import {
  COMPONENTS,
  CATEGORY_LABELS,
  FOUNDATIONS,
  type ComponentCategory,
  type ComponentDefinition,
} from './catalog';
import { ComponentPreview } from './ComponentPreview';
import { ComponentPlayground } from './ComponentPlayground';
import { DocSection, Guidance } from './Documentation';
import { FoundationContent, FOUNDATION_SECTIONS } from './Foundations';

function subscribeToHash(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

function getHash() {
  return window.location.hash.slice(1) || 'overview';
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ComponentCategory[];
const DOC_SECTIONS = [
  { id: 'playground', label: '플레이그라운드' },
  { id: 'anatomy', label: '구성 요소' },
  { id: 'properties', label: '속성' },
  { id: 'guidelines', label: '사용 기준' },
  { id: 'accessibility', label: '접근성' },
];

function matchesQuery(query: string, ...values: string[]) {
  return values.join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}

function ComponentDoc({ component }: { component: ComponentDefinition }) {
  return (
    <div className="space-y-12">
      <DocSection
        id={`${component.id}--playground`}
        title="Playground"
        description="실제 서비스 컴포넌트입니다. 속성을 바꾸고 직접 사용해 보세요."
      >
        <ComponentPlayground key={component.id} component={component} />
      </DocSection>
      <DocSection id={`${component.id}--anatomy`} title="구성 요소">
        <div className="flex flex-wrap gap-3 rounded-2xl border border-mt-border bg-mt-bg-soft/50 p-6">
          {component.anatomy.map((part, index) => (
            <div
              key={part}
              className="inline-flex items-center gap-2 rounded-lg border border-mt-border bg-mt-white px-3 py-2 text-xs font-medium text-mt-text-secondary"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mt-badge-bg font-mono text-action-primary">
                {index + 1}
              </span>
              {part}
            </div>
          ))}
        </div>
      </DocSection>
      <DocSection
        id={`${component.id}--properties`}
        title="Properties"
        description={
          component.id === 'toast'
            ? 'showToast(payload)에 전달하는 옵션입니다.'
            : `${component.source}에서 제공하는 속성입니다. 네이티브 속성 지원 여부는 각 컴포넌트의 타입을 따릅니다.`
        }
      >
        <div
          className="overflow-x-auto rounded-2xl border border-mt-border"
          tabIndex={0}
          role="region"
          aria-label={`${component.name} 속성 표`}
        >
          <table className="w-full text-left text-xs leading-6">
            <caption className="sr-only">{component.source} 속성, 타입, 기본값과 설명</caption>
            <thead className="border-b border-mt-border bg-mt-bg-soft text-mt-text-secondary">
              <tr>
                {['속성', '타입', '기본값', '설명'].map((heading) => (
                  <th key={heading} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mt-border">
              {component.props.map((prop) => (
                <tr key={prop.name}>
                  <th
                    scope="row"
                    className="whitespace-nowrap px-4 py-4 align-top font-mono font-medium text-action-primary"
                  >
                    {prop.name}
                  </th>
                  <td className="min-w-36 px-4 py-4 align-top font-mono text-mt-text-secondary">
                    {prop.type}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 align-top font-mono text-mt-text-secondary">
                    {prop.defaultValue}
                  </td>
                  <td className="min-w-40 px-4 py-4 align-top text-mt-text-secondary">
                    {prop.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="font-mono text-xs leading-6 break-all text-mt-text-secondary">
          components/shared/{component.source}.tsx
        </p>
      </DocSection>
      <DocSection id={`${component.id}--guidelines`} title="사용 기준">
        <Guidance items={component.guidelines} />
      </DocSection>
      <DocSection id={`${component.id}--accessibility`} title="접근성">
        <Guidance items={component.accessibility} accessibility />
      </DocSection>
    </div>
  );
}

function Overview({ query, onClearSearch }: { query: string; onClearSearch: () => void }) {
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
          {(['all', ...CATEGORIES] as const).map((item) => (
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

export default function DesignSystemPage() {
  const hash = useSyncExternalStore(subscribeToHash, getHash, () => 'overview');
  const requestedId = hash.split('--')[0];
  const currentId =
    COMPONENTS.some((item) => item.id === requestedId) ||
    FOUNDATIONS.some((item) => item.id === requestedId)
      ? requestedId
      : 'overview';
  const component = COMPONENTS.find((item) => item.id === currentId);
  const foundation = FOUNDATIONS.find((item) => item.id === currentId);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const sidebarSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const target = document.getElementById(hash);
    if (target) target.scrollIntoView({ block: 'start' });
  }, [hash]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
      if (
        event.key !== '/' ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        (event.target instanceof HTMLElement &&
          (event.target.matches('input, textarea, select') || event.target.isContentEditable))
      )
        return;
      event.preventDefault();
      if (window.matchMedia('(min-width: 1024px)').matches) sidebarSearchRef.current?.focus();
      else searchRef.current?.focus();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const updateSearch = (value: string) => {
    setQuery(value);
    if (currentId !== 'overview') window.location.hash = 'overview';
  };
  const navLinkClass = (active: boolean) =>
    `flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-action-primary ${active ? 'bg-mt-badge-bg font-semibold text-action-primary' : 'text-mt-text-secondary hover:bg-mt-bg-soft hover:text-mt-text-primary'}`;
  const renderSearch = (mobile: boolean) => (
    <label className="flex items-center gap-2 rounded-lg border border-mt-border bg-mt-bg-soft/60 px-3 py-2 text-mt-text-secondary">
      <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <input
        ref={mobile ? searchRef : sidebarSearchRef}
        value={query}
        onChange={(event) => updateSearch(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setQuery('');
            event.currentTarget.blur();
          }
        }}
        aria-label="디자인 시스템 검색"
        aria-keyshortcuts="/"
        placeholder="컴포넌트 검색"
        className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-mt-text-nav"
      />
      <kbd
        className="rounded border border-mt-border bg-mt-white px-1.5 font-mono text-xs"
        aria-hidden
      >
        /
      </kbd>
    </label>
  );
  const navigation = (
    <>
      <a
        href="#overview"
        onClick={() => setMenuOpen(false)}
        className={navLinkClass(currentId === 'overview')}
      >
        <span className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5" aria-hidden />
          Overview
        </span>
        <span className="text-xs">{COMPONENTS.length}</span>
      </a>
      <div className="mt-7">
        <p className="px-3 text-xs font-semibold tracking-wide text-mt-text-nav">FOUNDATIONS</p>
        <div className="mt-2 space-y-0.5">
          {FOUNDATIONS.filter((item) =>
            matchesQuery(query, item.name, item.koreanName, item.description),
          ).map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setMenuOpen(false)}
              className={navLinkClass(currentId === item.id)}
            >
              {item.name}
              {currentId === item.id && <span className="h-1 w-1 rounded-full bg-action-primary" />}
            </a>
          ))}
        </div>
      </div>
      <div className="mt-7">
        <p className="px-3 text-xs font-semibold tracking-wide text-mt-text-nav">COMPONENTS</p>
        {CATEGORIES.map((category) => {
          const items = COMPONENTS.filter(
            (item) =>
              item.category === category &&
              matchesQuery(
                query,
                item.name,
                item.koreanName,
                item.description,
                item.source,
                CATEGORY_LABELS[item.category],
              ),
          );
          return (
            items.length > 0 && (
              <div key={category} className="mt-4">
                <p className="mb-1 px-3 text-xs text-mt-text-nav">{CATEGORY_LABELS[category]}</p>
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={() => setMenuOpen(false)}
                      className={navLinkClass(currentId === item.id)}
                    >
                      {item.name}
                      {currentId === item.id && (
                        <span className="h-1 w-1 rounded-full bg-action-primary" />
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )
          );
        })}
      </div>
    </>
  );
  const sections = component ? DOC_SECTIONS : foundation ? FOUNDATION_SECTIONS[foundation.id] : [];
  const docIndex = component ? COMPONENTS.indexOf(component) : -1;
  const previous = COMPONENTS[docIndex - 1];
  const next = COMPONENTS[docIndex + 1];

  return (
    <div className="ds-root min-h-screen bg-mt-white break-keep text-mt-text-primary">
      <a
        href="#ds-main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('ds-main')?.focus();
          document.getElementById('ds-main')?.scrollIntoView({ block: 'start' });
        }}
        className="sr-only z-50 rounded-lg bg-action-primary p-3 text-sm text-mt-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        본문으로 건너뛰기
      </a>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-mt-border bg-mt-white px-4 sm:px-6">
        <a
          href="#overview"
          className="flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-action-primary"
          aria-label="meeTeam 디자인 시스템 홈"
        >
          <AppLogo className="h-8 w-28" priority />
          <span className="hidden border-l border-mt-border pl-3 text-xs font-medium text-mt-text-secondary sm:block">
            Design System
          </span>
        </a>
        <nav
          className="hidden h-full items-center gap-7 text-xs font-medium md:flex"
          aria-label="상단 내비게이션"
        >
          <a
            href="#overview"
            aria-current={!foundation ? 'page' : undefined}
            className={`inline-flex h-full items-center border-b-2 px-1 ${!foundation ? 'border-action-primary text-action-primary' : 'border-transparent text-mt-text-secondary'}`}
          >
            컴포넌트
          </a>
          <a
            href="#colors"
            aria-current={foundation ? 'page' : undefined}
            className={`inline-flex h-full items-center border-b-2 px-1 ${foundation ? 'border-action-primary text-action-primary' : 'border-transparent text-mt-text-secondary'}`}
          >
            파운데이션
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg text-xs text-mt-text-secondary transition-colors hover:text-action-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-action-primary"
          >
            서비스로<span className="hidden sm:inline"> 돌아가기</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={menuOpen}
            aria-controls="ds-mobile-nav"
            className="rounded-lg p-2 text-mt-text-primary focus-visible:outline-2 focus-visible:outline-action-primary lg:hidden"
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </header>
      <aside
        className="fixed top-16 bottom-0 left-0 hidden w-60 flex-col border-r border-mt-border bg-mt-white lg:flex"
        aria-label="디자인 시스템 사이드바"
      >
        <div className="p-5 pb-3">{renderSearch(false)}</div>
        <nav
          className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-8"
          aria-label="디자인 시스템 문서"
        >
          {navigation}
        </nav>
        <div className="border-t border-mt-border p-5">
          <a
            href="/storybook/index.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-lg text-xs text-mt-text-secondary hover:text-action-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-action-primary"
          >
            <span className="flex items-center gap-2">
              <Code2 className="h-4 w-4" aria-hidden />
              Storybook
            </span>
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
          <p className="mt-3 text-xs text-mt-text-nav">Built together, with meeTeam.</p>
        </div>
      </aside>
      <div className="border-b border-mt-border bg-mt-white p-4 lg:hidden">
        {renderSearch(true)}
        <nav
          id="ds-mobile-nav"
          aria-label="모바일 디자인 시스템 문서"
          hidden={!menuOpen}
          className="mt-4 max-h-96 overflow-y-auto"
        >
          {navigation}
        </nav>
      </div>
      <div className="lg:pl-60">
        <div className="mx-auto flex w-full max-w-7xl items-start gap-12 px-5 py-8 sm:px-8 md:py-12 xl:px-10">
          <main id="ds-main" className="min-w-0 flex-1 scroll-mt-24" tabIndex={-1}>
            <div id={currentId} className="scroll-mt-24">
              <div className="flex flex-wrap items-center gap-2 text-xs text-mt-text-secondary">
                <BookOpen className="h-3.5 w-3.5" aria-hidden />
                <a
                  href="#overview"
                  className="rounded hover:text-action-primary focus-visible:outline-2 focus-visible:outline-action-primary"
                >
                  Design System
                </a>
                <ChevronRight className="h-3 w-3 text-mt-text-nav" aria-hidden />
                <span>{foundation ? 'Foundations' : 'Components'}</span>
                {(component || foundation) && (
                  <>
                    <ChevronRight className="h-3 w-3 text-mt-text-nav" aria-hidden />
                    <span className="text-mt-text-primary">
                      {component?.name ?? foundation?.name}
                    </span>
                  </>
                )}
              </div>
              <div className="mt-6 mb-8">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {component?.name ?? foundation?.name ?? 'Components'}
                  </h1>
                  {component && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-mt-border bg-mt-bg-soft px-2.5 py-1 text-xs font-medium text-action-primary">
                      <Check className="h-3 w-3" aria-hidden />
                      구현됨
                    </span>
                  )}
                </div>
                <p className="mt-4 max-w-xl text-sm leading-7 text-mt-text-secondary">
                  {component?.description ??
                    (foundation
                      ? {
                          colors:
                            '색을 고르기 전에 역할을 정합니다. meeTeam의 브랜드, 표면, 텍스트와 피드백을 위한 컬러 시스템입니다.',
                          typography:
                            '어떤 화면에서도 편안하게 읽히도록. 서체와 크기, 굵기로 정보의 흐름을 만듭니다.',
                          spacing:
                            '정돈된 화면을 만드는 보이지 않는 규칙. 간격과 모서리, 깊이를 일관되게 사용합니다.',
                          icons:
                            '작은 형태로 분명한 의미를 전달합니다. 제품 전체에서 일관된 아이콘 언어를 사용합니다.',
                        }[foundation.id]
                      : 'meeTeam의 인터페이스를 만드는 재료들. 공통 컴포넌트와 사용 기준을 한곳에서 살펴보세요.')}
                </p>
                {component && (
                  <div className="mt-5 flex flex-wrap items-center gap-4">
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-mt-text-secondary">
                      <Code2 className="h-3.5 w-3.5" aria-hidden />
                      {component.source}
                    </span>
                    <a
                      href={`/storybook/index.html?path=/story/${component.story}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded text-xs font-medium text-action-primary focus-visible:outline-2 focus-visible:outline-action-primary"
                    >
                      Storybook에서 보기
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  </div>
                )}
              </div>
            </div>
            {component ? (
              <ComponentDoc component={component} />
            ) : foundation ? (
              <div className="space-y-12">
                <FoundationContent id={foundation.id} />
              </div>
            ) : (
              <Overview query={query} onClearSearch={() => setQuery('')} />
            )}
            {component && (
              <nav
                className="mt-14 grid grid-cols-2 gap-4 border-t border-mt-border pt-6"
                aria-label="이전 다음 컴포넌트"
              >
                <div>
                  {previous && (
                    <a
                      href={`#${previous.id}`}
                      className="group block rounded-xl border border-mt-border p-4 hover:bg-mt-bg-soft"
                    >
                      <span className="flex items-center gap-1.5 text-xs text-mt-text-secondary">
                        <ArrowLeft className="h-3 w-3" aria-hidden />
                        이전
                      </span>
                      <p className="mt-2 text-sm font-semibold group-hover:text-action-primary">
                        {previous.name}
                      </p>
                    </a>
                  )}
                </div>
                <div>
                  {next && (
                    <a
                      href={`#${next.id}`}
                      className="group block rounded-xl border border-mt-border p-4 text-right hover:bg-mt-bg-soft"
                    >
                      <span className="flex items-center justify-end gap-1.5 text-xs text-mt-text-secondary">
                        다음
                        <ArrowRight className="h-3 w-3" aria-hidden />
                      </span>
                      <p className="mt-2 text-sm font-semibold group-hover:text-action-primary">
                        {next.name}
                      </p>
                    </a>
                  )}
                </div>
              </nav>
            )}
            <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-mt-border pt-6 text-xs text-mt-text-nav">
              <span>meeTeam Design System</span>
              <span>작은 기준이 모여, 더 나은 연결로.</span>
            </footer>
          </main>
          {sections.length > 0 && (
            <aside
              className="sticky top-28 hidden w-36 shrink-0 xl:block"
              aria-label="이 페이지 목차"
            >
              <p className="mb-4 flex items-center gap-2 text-xs font-semibold text-mt-text-primary">
                <SlidersHorizontal className="h-3 w-3" aria-hidden />이 페이지에서
              </p>
              <nav className="space-y-3 border-l border-mt-border">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${currentId}--${section.id}`}
                    aria-current={hash === `${currentId}--${section.id}` ? 'location' : undefined}
                    className={`block border-l-2 py-1 pl-3 text-xs transition-colors hover:text-action-primary ${hash === `${currentId}--${section.id}` ? '-ml-px border-action-primary font-semibold text-action-primary' : 'border-transparent text-mt-text-secondary'}`}
                  >
                    {section.label}
                  </a>
                ))}
              </nav>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
