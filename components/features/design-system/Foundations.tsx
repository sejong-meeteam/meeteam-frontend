'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  Filter,
  Heart,
  Info,
  Layers,
  Link,
  LoaderCircle,
  Mail,
  MessageCircle,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { CodeBlock, CopyButton, DocSection, Guidance } from './Documentation';

function subscribeToTokens() {
  return () => {};
}

function ColorValue({ name }: { name: string }) {
  const getSnapshot = useCallback(
    () => getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim(),
    [name],
  );
  const value = useSyncExternalStore(subscribeToTokens, getSnapshot, () => '');

  return <span className="font-mono text-xs text-mt-text-secondary">{value || 'CSS token'}</span>;
}

const COLOR_GROUPS = [
  {
    title: 'Brand & Action',
    description: '브랜드의 인상과 사용자의 주요 행동을 구분합니다.',
    tokens: [
      ['mt-primary', 'bg-mt-primary', '브랜드 기본색'],
      ['action-primary', 'bg-action-primary', '주요 버튼과 액션'],
      ['mt-hero-blue', 'bg-mt-hero-blue', '강조와 히어로'],
      ['mt-logo-blue', 'bg-mt-logo-blue', '로고와 포커스'],
      ['mt-mascot-blue', 'bg-mt-mascot-blue', '마스코트'],
      ['mt-cheek-blue', 'bg-mt-cheek-blue', '마스코트 포인트'],
    ],
  },
  {
    title: 'Surface & Border',
    description: '콘텐츠의 층위와 영역 사이의 경계를 만듭니다.',
    tokens: [
      ['mt-white', 'bg-mt-white', '컴포넌트 표면'],
      ['mt-bg', 'bg-mt-bg', '페이지 배경'],
      ['mt-bg-soft', 'bg-mt-bg-soft', '부드러운 배경'],
      ['mt-badge-bg', 'bg-mt-badge-bg', '강조 배경'],
      ['mt-border', 'bg-mt-border', '기본 테두리'],
      ['mt-shadow-blue', 'bg-mt-shadow-blue', '그림자 색상'],
    ],
  },
  {
    title: 'Text',
    description: '텍스트의 중요도에 따라 시각적 위계를 제공합니다.',
    tokens: [
      ['mt-text-primary', 'bg-mt-text-primary', '제목과 본문'],
      ['mt-text-secondary', 'bg-mt-text-secondary', '설명과 보조 정보'],
      ['mt-text-nav', 'bg-mt-text-nav', '내비게이션'],
    ],
  },
  {
    title: 'Feedback',
    description: '서비스에 정의된 피드백 색상입니다. 의미를 텍스트와 함께 전달합니다.',
    tokens: [
      ['mt-mint', 'bg-mt-mint', '모집중과 성공 아이콘'],
      ['mt-danger', 'bg-mt-danger', '중단과 위험'],
      ['mt-danger-soft', 'bg-mt-danger-soft', '위험 안내 배경'],
      ['feedback-error', 'bg-feedback-error', '입력 오류 안내'],
    ],
  },
  {
    title: 'Project categories',
    description: '프로젝트 유형마다 배경, 테두리, 텍스트 토큰을 함께 사용합니다.',
    tokens: [
      ['mt-category-capstone-bg', 'bg-mt-category-capstone-bg', '캡스톤 · 배경'],
      ['mt-category-capstone-border', 'bg-mt-category-capstone-border', '캡스톤 · 테두리'],
      ['mt-category-capstone-text', 'bg-mt-category-capstone-text', '캡스톤 · 텍스트'],
      ['mt-category-creative-bg', 'bg-mt-category-creative-bg', '창의학기제 · 배경'],
      ['mt-category-creative-border', 'bg-mt-category-creative-border', '창의학기제 · 테두리'],
      ['mt-category-creative-text', 'bg-mt-category-creative-text', '창의학기제 · 텍스트'],
      ['mt-category-club-bg', 'bg-mt-category-club-bg', '동아리 · 배경'],
      ['mt-category-club-border', 'bg-mt-category-club-border', '동아리 · 테두리'],
      ['mt-category-club-text', 'bg-mt-category-club-text', '동아리 · 텍스트'],
      ['mt-category-other-bg', 'bg-mt-category-other-bg', '기타 · 배경'],
      ['mt-category-other-border', 'bg-mt-category-other-border', '기타 · 테두리'],
      ['mt-category-other-text', 'bg-mt-category-other-text', '기타 · 텍스트'],
    ],
  },
];

const TYPE_SCALE = [
  {
    name: 'Display',
    className: 'text-5xl font-bold tracking-tight',
    token: 'text-5xl',
    size: '48 / 48',
    example: '함께, 더 멀리',
  },
  {
    name: 'Heading 1',
    className: 'text-4xl font-bold tracking-tight',
    token: 'text-4xl',
    size: '36 / 40',
    example: '새로운 연결의 시작',
  },
  {
    name: 'Heading 2',
    className: 'text-3xl font-bold tracking-tight',
    token: 'text-3xl',
    size: '30 / 36',
    example: '좋은 팀이 만드는 가능성',
  },
  {
    name: 'Heading 3',
    className: 'text-2xl font-bold',
    token: 'text-2xl',
    size: '24 / 32',
    example: '함께할 팀원을 만나보세요',
  },
  {
    name: 'Title',
    className: 'text-xl font-semibold',
    token: 'text-xl',
    size: '20 / 28',
    example: '우리의 다음 프로젝트',
  },
  {
    name: 'Body',
    className: 'text-base font-normal',
    token: 'text-base',
    size: '16 / 24',
    example: '각자의 가능성이 만나 새로운 이야기가 시작됩니다.',
  },
  {
    name: 'Body small',
    className: 'text-sm font-normal',
    token: 'text-sm',
    size: '14 / 20',
    example: '프로젝트에 대한 궁금한 점을 자유롭게 나눠보세요.',
  },
  {
    name: 'Caption',
    className: 'text-xs font-medium',
    token: 'text-xs',
    size: '12 / 16',
    example: '작은 안내까지 편안하게 읽을 수 있도록',
  },
];

const SPACING = [
  { name: '1', pixels: 4, width: 'w-1' },
  { name: '2', pixels: 8, width: 'w-2' },
  { name: '3', pixels: 12, width: 'w-3' },
  { name: '4', pixels: 16, width: 'w-4' },
  { name: '5', pixels: 20, width: 'w-5' },
  { name: '6', pixels: 24, width: 'w-6' },
  { name: '8', pixels: 32, width: 'w-8' },
  { name: '10', pixels: 40, width: 'w-10' },
  { name: '12', pixels: 48, width: 'w-12' },
  { name: '16', pixels: 64, width: 'w-16' },
  { name: '20', pixels: 80, width: 'w-20' },
  { name: '24', pixels: 96, width: 'w-24' },
];

const ICONS = {
  Search,
  Plus,
  X,
  Check,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Bell,
  Mail,
  MessageCircle,
  Heart,
  Bookmark,
  Calendar,
  Settings,
  Filter,
  Trash2,
  Link,
  ExternalLink,
  Copy,
  Eye,
  Info,
  CircleHelp,
  CheckCircle2,
  ShieldCheck,
  LoaderCircle,
  Layers,
  Code2,
  Sparkles,
};

export const FOUNDATION_SECTIONS: Record<string, { id: string; label: string }[]> = {
  colors: [
    { id: 'palette', label: '컬러 팔레트' },
    { id: 'usage', label: '사용 기준' },
  ],
  typography: [
    { id: 'font', label: '서체' },
    { id: 'scale', label: '타입 스케일' },
    { id: 'usage', label: '사용 기준' },
  ],
  spacing: [
    { id: 'scale', label: '간격 스케일' },
    { id: 'radius', label: '모서리' },
    { id: 'elevation', label: '그림자' },
  ],
  icons: [
    { id: 'library', label: '아이콘 라이브러리' },
    { id: 'usage', label: '사용 기준' },
  ],
};

export function FoundationContent({ id }: { id: string }) {
  if (id === 'colors')
    return (
      <>
        <DocSection
          id="colors--palette"
          title="컬러 팔레트"
          description="globals.css의 실제 토큰을 사용합니다. 복사 버튼으로 Tailwind 클래스를 가져갈 수 있어요."
        >
          <div className="space-y-10">
            {COLOR_GROUPS.map((group) => (
              <section key={group.title}>
                <h3 className="text-sm font-semibold">{group.title}</h3>
                <p className="mt-1 text-xs leading-6 text-mt-text-secondary">{group.description}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {group.tokens.map(([name, color, description]) => (
                    <div key={name} className="overflow-hidden rounded-xl border border-mt-border">
                      <div className={`h-20 border-b border-mt-border ${color}`} />
                      <div className="space-y-3 p-3">
                        <p className="break-all font-mono text-xs text-mt-text-primary">{name}</p>
                        <ColorValue name={name} />
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-mt-text-secondary">{description}</span>
                          <CopyButton value={color} label={`${color} 클래스 복사`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </DocSection>
        <DocSection id="colors--usage" title="역할에 맞게 사용하기">
          <Guidance
            items={[
              '모든 색상은 @theme에 등록된 토큰을 사용합니다. 색상 값이 바뀌어도 의미와 사용처가 유지되도록 역할을 기준으로 선택하세요.',
              '새로운 색상이 필요하면 globals.css에 먼저 토큰을 추가하세요. 컴포넌트에 색상 값이나 임의 색상 클래스를 직접 작성하지 않습니다.',
              '텍스트와 배경의 대비는 실제 조합으로 확인하세요. 밝은 브랜드 컬러를 작은 본문 텍스트에 사용할 때는 특히 주의가 필요합니다.',
              '입력 오류는 현재 서비스의 feedback-error 토큰을 따릅니다. 색상만으로 의미를 구분하지 않고 원인과 해결 방법을 문구로 안내하세요.',
            ]}
          />
          <CodeBlock
            code={
              '<section className="bg-mt-white text-mt-text-primary">\n  <h2 className="text-xl font-bold">함께할 팀원을 찾아보세요</h2>\n  <p className="mt-2 text-sm text-mt-text-secondary">\n    새로운 프로젝트가 기다리고 있어요.\n  </p>\n</section>'
            }
          />
        </DocSection>
      </>
    );

  if (id === 'typography')
    return (
      <>
        <DocSection
          id="typography--font"
          title="우리의 서체"
          description="제품의 정보는 Pretendard로, 브랜드의 개성은 Jua로 전달합니다."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-mt-border p-6">
              <span className="text-xs font-medium text-mt-text-secondary">
                PRODUCT · PRETENDARD
              </span>
              <p className="mt-7 text-6xl font-semibold">가 Aa</p>
              <p className="mt-5 text-sm leading-7 text-mt-text-secondary">
                명료한 본문과 인터페이스를 위한 기본 서체.
                <br />
                400 Regular · 500 Medium · 600 Semibold · 700 Bold
              </p>
            </div>
            <div className="rounded-2xl border border-mt-border bg-mt-bg-soft p-6">
              <span className="text-xs font-medium text-mt-text-secondary">BRAND · JUA</span>
              <p className="font-brand-display mt-7 text-6xl text-action-primary">가 Aa</p>
              <p className="mt-5 text-sm leading-7 text-mt-text-secondary">
                브랜드 메시지와 포인트 타이틀을 위한 서체.
                <br />
                400 Regular · font-brand-display
              </p>
            </div>
          </div>
        </DocSection>
        <DocSection
          id="typography--scale"
          title="타입 스케일"
          description="Tailwind 기본 스케일을 기준으로 사용합니다. 수치는 글자 크기 / 줄 높이(px)입니다."
        >
          <div className="divide-y divide-mt-border overflow-hidden rounded-2xl border border-mt-border">
            {TYPE_SCALE.map((type) => (
              <div key={type.name} className="grid gap-4 p-5 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold">{type.name}</p>
                  <p className="mt-1 font-mono text-xs text-mt-text-secondary">
                    {type.token} · {type.size}
                  </p>
                </div>
                <p className={`min-w-0 break-keep lg:col-span-3 ${type.className}`}>
                  {type.example}
                </p>
              </div>
            ))}
          </div>
        </DocSection>
        <DocSection id="typography--usage" title="읽기 쉬운 위계 만들기">
          <Guidance
            items={[
              '페이지에 하나의 h1을 두고 제목 단계를 순서대로 사용하세요. 글자의 시각적 크기와 HTML의 의미는 각각 적절하게 설정합니다.',
              '장문 본문에는 text-base와 leading-7처럼 여유 있는 줄 높이를 사용하세요. text-xs는 짧은 보조 정보에 제한합니다.',
              '모바일에서는 긴 제목의 줄바꿈을 확인하세요. 고정 높이나 너비로 텍스트가 잘리지 않도록 합니다.',
            ]}
          />
        </DocSection>
      </>
    );

  if (id === 'spacing')
    return (
      <>
        <DocSection
          id="spacing--scale"
          title="작은 단위가 만드는 일관성"
          description="기본 간격은 4px 단위로 맞추고, Tailwind의 spacing 스케일을 우선 사용합니다."
        >
          <div className="overflow-hidden rounded-2xl border border-mt-border">
            <div className="grid grid-cols-3 border-b border-mt-border bg-mt-bg-soft px-5 py-3 text-xs font-semibold text-mt-text-secondary">
              <span>Scale</span>
              <span>Size</span>
              <span>Preview</span>
            </div>
            {SPACING.map((space) => (
              <div
                key={space.name}
                className="grid grid-cols-3 items-center border-b border-mt-border/50 px-5 py-3 last:border-0"
              >
                <code className="text-xs text-action-primary">gap-{space.name}</code>
                <span className="font-mono text-xs text-mt-text-secondary">{space.pixels}px</span>
                <div className={`h-3 rounded-sm bg-mt-primary ${space.width}`} />
              </div>
            ))}
          </div>
          <Guidance
            items={[
              '아이콘과 텍스트 사이에는 gap-2, 관련된 입력 요소 사이에는 gap-4 또는 gap-6을 기본으로 검토하세요.',
              '섹션의 바깥 여백과 내부 여백을 구분합니다. 작은 화면에서는 px-4, 넓은 화면에서는 px-6 또는 px-8처럼 유연하게 적용하세요.',
            ]}
          />
        </DocSection>
        <DocSection
          id="spacing--radius"
          title="모서리"
          description="작은 정보 요소부터 큰 컨테이너까지 크기에 맞는 형태를 사용합니다."
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { token: 'rounded-md', shape: 'rounded-md', usage: '작은 칩' },
              { token: 'rounded-xl', shape: 'rounded-xl', usage: '버튼 · 입력창' },
              { token: 'rounded-2xl', shape: 'rounded-2xl', usage: '카드 · 대화상자' },
              { token: 'rounded-full', shape: 'rounded-full', usage: '아바타 · 배지' },
            ].map((radius) => (
              <div key={radius.token} className="rounded-xl border border-mt-border p-4">
                <div
                  className={`mx-auto h-20 w-20 border border-mt-logo-blue bg-mt-badge-bg ${radius.shape}`}
                />
                <p className="mt-4 text-center font-mono text-xs">{radius.token}</p>
                <p className="mt-1 text-center text-xs text-mt-text-secondary">{radius.usage}</p>
              </div>
            ))}
          </div>
        </DocSection>
        <DocSection
          id="spacing--elevation"
          title="깊이와 그림자"
          description="그림자는 떠 있는 요소의 관계를 전달할 때 사용합니다."
        >
          <div className="grid gap-6 rounded-2xl border border-mt-border bg-mt-bg-soft p-8 sm:grid-cols-3">
            {['shadow-sm', 'shadow-lg', 'shadow-2xl'].map((shadow) => (
              <div
                key={shadow}
                className={`rounded-xl bg-mt-white px-4 py-8 text-center font-mono text-xs ${shadow}`}
              >
                {shadow}
              </div>
            ))}
          </div>
        </DocSection>
      </>
    );

  return (
    <>
      <DocSection
        id="icons--library"
        title="작고 명확한 시각 언어"
        description="프로젝트의 기본 아이콘은 lucide-react입니다. 아래에서 실제 렌더링과 import 코드를 확인하세요."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {Object.entries(ICONS).map(([name, Icon]) => (
            <div
              key={name}
              className="flex flex-col items-center gap-3 rounded-xl border border-mt-border bg-mt-white p-4 transition-colors hover:bg-mt-bg-soft"
            >
              <Icon className="h-5 w-5 text-mt-text-primary" strokeWidth={1.8} aria-hidden />
              <span className="font-mono text-xs text-mt-text-secondary">{name}</span>
              <CopyButton
                value={`import { ${name} } from 'lucide-react';`}
                label={`${name} import 복사`}
              />
            </div>
          ))}
        </div>
      </DocSection>
      <DocSection id="icons--usage" title="크기와 접근성">
        <Guidance
          items={[
            '본문 옆에는 h-4 w-4, 독립적인 액션에는 h-5 w-5를 기본으로 사용합니다. strokeWidth는 1.8 또는 2로 일관되게 맞추세요.',
            '장식용 아이콘에는 aria-hidden을 지정합니다. 아이콘만 있는 버튼에는 동작을 설명하는 aria-label을 제공합니다.',
            '아이콘의 시각적 크기와 클릭 영역은 다릅니다. 작은 아이콘도 충분한 패딩을 가진 버튼 안에 배치하세요.',
          ]}
        />
        <CodeBlock
          code={
            'import { Plus } from \'lucide-react\';\n\n<button type="button" aria-label="프로젝트 추가"\n  className="rounded-xl p-3 text-action-primary hover:bg-mt-bg-soft\n    focus-visible:outline-2 focus-visible:outline-action-primary">\n  <Plus className="h-5 w-5" strokeWidth={1.8} aria-hidden />\n</button>'
          }
        />
      </DocSection>
    </>
  );
}
