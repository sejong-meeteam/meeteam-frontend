'use client';

import type { ComponentDefinition } from './catalog';
import { ComponentPlayground } from './ComponentPlayground';
import { DocSection, Guidance } from './Documentation';
import { useDocumentAnchor } from './useDocumentAnchor';

export default function ComponentDoc({
  component,
  anchor,
}: {
  component: ComponentDefinition;
  anchor: string;
}) {
  useDocumentAnchor(anchor);
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
