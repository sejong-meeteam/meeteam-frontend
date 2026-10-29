'use client';

import { useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Check, CheckCircle2, RotateCcw, Search } from 'lucide-react';
import BaseButton, { type BaseButtonProps } from '@/components/shared/BaseButton';
import BaseInput from '@/components/shared/BaseInput';
import BaseTextarea from '@/components/shared/BaseTextarea';
import BaseField from '@/components/shared/BaseField';
import BaseDropdown from '@/components/shared/BaseDropdown';
import BaseTag from '@/components/shared/BaseTag';
import SkillChip from '@/components/shared/SkillChip';
import CategoryBadge from '@/components/shared/CategoryBadge';
import StatusBadge from '@/components/shared/StatusBadge';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import ConfirmModal from '@/components/shared/ConfirmModal';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import { useToastStore, type ToastTone } from '@/stores/useToastStore';
import { CodeBlock } from './Documentation';
import type { ComponentDefinition } from './catalog';

type InputSize = 'L' | 'M' | 'S';
type BadgeSize = 'sm' | 'md';
type Status = 'open' | 'closed' | 'deadline' | 'suspended' | 'completed' | 'pending' | 'leader';

function SelectControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-xs font-medium text-mt-text-secondary">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-9 w-full rounded-lg border border-mt-border bg-mt-white px-2 text-sm text-mt-text-primary focus-visible:outline-2 focus-visible:outline-action-primary"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleControl({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs font-medium text-mt-text-secondary">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-action-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      />
    </label>
  );
}

export function ComponentPlayground({ component }: { component: ComponentDefinition }) {
  const [buttonSize, setButtonSize] = useState<NonNullable<BaseButtonProps['size']>>('M');
  const [buttonVariant, setButtonVariant] =
    useState<NonNullable<BaseButtonProps['variant']>>('primary');
  const [inputSize, setInputSize] = useState<InputSize>('M');
  const [disabled, setDisabled] = useState(false);
  const [full, setFull] = useState(false);
  const [icon, setIcon] = useState(true);
  const [fieldState, setFieldState] = useState('default');
  const [required, setRequired] = useState(true);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [text, setText] = useState('');
  const [selected, setSelected] = useState(true);
  const [chipVariant, setChipVariant] = useState<'primary' | 'neutral' | 'outline'>('neutral');
  const [badgeSize, setBadgeSize] = useState<BadgeSize>('sm');
  const [removed, setRemoved] = useState(false);
  const [removable, setRemovable] = useState(true);
  const [category, setCategory] = useState('캡스톤');
  const [status, setStatus] = useState<Status>('open');
  const [statusSize, setStatusSize] = useState<'xs' | 'sm' | 'md'>('sm');
  const [shape, setShape] = useState<'circle' | 'rounded'>('circle');
  const [avatarSize, setAvatarSize] = useState('M');
  const [tone, setTone] = useState<ToastTone>('success');
  const [duration, setDuration] = useState('4200');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const restoreChipRef = useRef<HTMLButtonElement>(null);
  const showToast = useToastStore((state) => state.showToast);
  const { id, source } = component;
  const error = fieldState === 'error';
  const inputDisabled = fieldState === 'disabled';
  const readOnly = fieldState === 'readOnly';
  let preview: ReactNode;
  let controls: ReactNode;
  let example = '';
  const inputControls = (
    <>
      <SelectControl
        label="Size"
        value={inputSize}
        options={['L', 'M', 'S']}
        onChange={setInputSize}
      />
      <SelectControl
        label="State"
        value={fieldState}
        options={
          id === 'textarea'
            ? ['default', 'disabled', 'readOnly']
            : ['default', 'error', 'disabled', 'readOnly']
        }
        onChange={setFieldState}
      />
    </>
  );

  switch (id) {
    case 'button':
      controls = (
        <>
          <SelectControl
            label="Variant"
            value={buttonVariant}
            options={['primary', 'gray']}
            onChange={setButtonVariant}
          />
          <SelectControl
            label="Size"
            value={buttonSize}
            options={['XL', 'L', 'M', 'S', 'XS']}
            onChange={setButtonSize}
          />
          <ToggleControl label="Disabled" checked={disabled} onChange={setDisabled} />
          <ToggleControl label="Full width" checked={full} onChange={setFull} />
          <ToggleControl label="Trailing icon" checked={icon} onChange={setIcon} />
        </>
      );
      preview = (
        <BaseButton
          size={buttonSize}
          variant={buttonVariant}
          full={full}
          disabled={disabled}
          onClick={() =>
            showToast({
              tone: 'success',
              message: '버튼을 눌렀어요. 여기에 액션을 연결할 수 있어요.',
            })
          }
        >
          프로젝트 만들기{icon && <ArrowRight className="ml-2 h-4 w-4" aria-hidden />}
        </BaseButton>
      );
      example = `${icon ? "import { ArrowRight } from 'lucide-react';\n" : ''}import BaseButton from '@/components/shared/BaseButton';\n\n<BaseButton size="${buttonSize}" variant="${buttonVariant}"${full ? ' full' : ''}${disabled ? ' disabled' : ''}>\n  프로젝트 만들기${icon ? '\n  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />' : ''}\n</BaseButton>`;
      break;
    case 'input':
    case 'field':
      controls = (
        <>
          {inputControls}
          {id === 'input' ? (
            <ToggleControl label="Leading icon" checked={icon} onChange={setIcon} />
          ) : (
            <ToggleControl label="Required label" checked={required} onChange={setRequired} />
          )}
        </>
      );
      preview = (
        <div className="w-full max-w-sm">
          <BaseField
            label={id === 'input' ? '프로젝트 검색' : '프로젝트 이름'}
            htmlFor="ds-example-input"
            required={id === 'field' ? required : false}
            hintText="함께 만들고 싶은 프로젝트를 입력해 주세요."
            errorText={error ? '프로젝트 이름을 입력해 주세요.' : undefined}
          >
            <BaseInput
              id="ds-example-input"
              inputSize={inputSize}
              error={error}
              disabled={inputDisabled}
              readOnly={readOnly}
              placeholder={readOnly ? '읽기 전용 입력창' : '새로운 연결의 시작'}
              leftIcon={
                id === 'input' && icon ? <Search className="h-4 w-4" aria-hidden /> : undefined
              }
              aria-describedby={`ds-example-input-${error ? 'error' : 'hint'}`}
            />
          </BaseField>
        </div>
      );
      example = `${id === 'input' && icon ? "import { Search } from 'lucide-react';\n" : ''}import BaseField from '@/components/shared/BaseField';\nimport BaseInput from '@/components/shared/BaseInput';\n\n<BaseField\n  label="${id === 'input' ? '프로젝트 검색' : '프로젝트 이름'}"\n  htmlFor="project-name"${(id === 'field' ? !required : true) ? '\n  required={false}' : ''}\n  ${error ? 'errorText="프로젝트 이름을 입력해 주세요."' : 'hintText="함께 만들고 싶은 프로젝트를 입력해 주세요."'}\n>\n  <BaseInput\n    id="project-name"\n    inputSize="${inputSize}"${error ? '\n    error' : ''}${inputDisabled ? '\n    disabled' : ''}${readOnly ? '\n    readOnly' : ''}${id === 'input' && icon ? '\n    leftIcon={<Search className="h-4 w-4" aria-hidden />}' : ''}\n    placeholder="새로운 연결의 시작"\n    aria-describedby="project-name-${error ? 'error' : 'hint'}"\n  />\n</BaseField>`;
      break;
    case 'textarea':
      controls = inputControls;
      preview = (
        <div className="w-full max-w-sm">
          <BaseField
            label="프로젝트 소개"
            htmlFor="ds-example-textarea"
            required={false}
            hintText="최대 500자까지 입력할 수 있어요."
          >
            <BaseTextarea
              id="ds-example-textarea"
              textareaSize={inputSize}
              disabled={inputDisabled}
              readOnly={readOnly}
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={500}
              placeholder="함께 만들고 싶은 프로젝트를 소개해 주세요."
              aria-describedby="ds-example-textarea-hint ds-textarea-count"
            />
          </BaseField>
          <p id="ds-textarea-count" className="mt-2 text-right text-xs text-mt-text-secondary">
            {text.length} / 500
          </p>
        </div>
      );
      example = `import BaseField from '@/components/shared/BaseField';\nimport BaseTextarea from '@/components/shared/BaseTextarea';\n\n<BaseField label="프로젝트 소개" htmlFor="intro" required={false}\n  hintText="최대 500자까지 입력할 수 있어요.">\n  <BaseTextarea id="intro" textareaSize="${inputSize}" rows={4}\n    maxLength={500}${inputDisabled ? ' disabled' : ''}${readOnly ? ' readOnly' : ''}\n    aria-describedby="intro-hint"\n    placeholder="함께 만들고 싶은 프로젝트를 소개해 주세요." />\n</BaseField>`;
      break;
    case 'dropdown':
      controls = (
        <ToggleControl
          label="Disabled"
          checked={disabled}
          onChange={(next) => {
            setDisabled(next);
            setOpen(false);
          }}
        />
      );
      preview = (
        <div className="w-full max-w-xs">
          <BaseDropdown
            value={value}
            placeholder="함께할 직군을 선택하세요"
            items={['프론트엔드', '백엔드', '프로덕트 디자인', '기획']}
            open={open}
            disabled={disabled}
            onToggle={() => setOpen((current) => !current)}
            onSelect={(item) => {
              setValue(item);
              setOpen(false);
            }}
            buttonClassName="items-center justify-between gap-3 bg-mt-white px-4 py-3 text-sm"
            selectMenuClassName="mt-2 p-1"
          />
        </div>
      );
      example = `import { useState } from 'react';\nimport BaseDropdown from '@/components/shared/BaseDropdown';\n\nfunction RoleSelect() {\n  const [open, setOpen] = useState(false);\n  const [value, setValue] = useState('');\n\n  return (\n    <BaseDropdown\n      value={value} open={open}${disabled ? ' disabled' : ''}\n      placeholder="함께할 직군을 선택하세요"\n      items={['프론트엔드', '백엔드', '프로덕트 디자인', '기획']}\n      onToggle={() => setOpen((current) => !current)}\n      onSelect={(item) => { setValue(item); setOpen(false); }}\n      buttonClassName="items-center justify-between gap-3 bg-mt-white px-4 py-3 text-sm"\n      selectMenuClassName="mt-2 p-1"\n    />\n  );\n}`;
      break;
    case 'tag':
      controls = (
        <>
          <SelectControl
            label="Size"
            value={inputSize}
            options={['L', 'M', 'S']}
            onChange={setInputSize}
          />
          <ToggleControl label="Selected" checked={selected} onChange={setSelected} />
        </>
      );
      preview = (
        <button
          type="button"
          aria-pressed={selected}
          onClick={() => setSelected((current) => !current)}
          className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-action-primary"
        >
          <BaseTag
            size={inputSize}
            selected={selected}
            leftIcon={selected ? <Check className="h-3.5 w-3.5" aria-hidden /> : undefined}
          >
            사이드 프로젝트
          </BaseTag>
        </button>
      );
      example = `import { useState } from 'react';\nimport { Check } from 'lucide-react';\nimport BaseTag from '@/components/shared/BaseTag';\n\nfunction ProjectFilter() {\n  const [selected, setSelected] = useState(${selected});\n  return (\n    <button type="button" aria-pressed={selected}\n      onClick={() => setSelected((current) => !current)}>\n      <BaseTag size="${inputSize}" selected={selected}\n        leftIcon={selected ? <Check className="h-3.5 w-3.5" aria-hidden /> : undefined}>\n        사이드 프로젝트\n      </BaseTag>\n    </button>\n  );\n}`;
      break;
    case 'skill-chip':
      controls = (
        <>
          <SelectControl
            label="Variant"
            value={chipVariant}
            options={['primary', 'neutral', 'outline']}
            onChange={setChipVariant}
          />
          <SelectControl
            label="Size"
            value={badgeSize}
            options={['sm', 'md']}
            onChange={setBadgeSize}
          />
          <ToggleControl
            label="Removable"
            checked={removable}
            onChange={(next) => {
              setRemovable(next);
              setRemoved(false);
            }}
          />
        </>
      );
      preview = (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {!removed && (
            <SkillChip
              label="React"
              variant={chipVariant}
              size={badgeSize}
              onRemove={
                removable
                  ? () => {
                      setRemoved(true);
                      restoreChipRef.current?.focus();
                    }
                  : undefined
              }
            />
          )}
          <SkillChip label="TypeScript" variant={chipVariant} size={badgeSize} />
          <button
            ref={restoreChipRef}
            type="button"
            disabled={!removed}
            onClick={() => setRemoved(false)}
            className="rounded-md px-2 py-1 text-xs text-action-primary disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-action-primary"
          >
            복원
          </button>
          <span className="sr-only" role="status">
            {removed ? 'React 칩을 삭제했어요.' : ''}
          </span>
        </div>
      );
      example = `import SkillChip from '@/components/shared/SkillChip';\n${removable ? 'import { useState } from \'react\';\n\nfunction Skills() {\n  const [visible, setVisible] = useState(true);\n  return visible ? (\n    <SkillChip label="React" variant="' + chipVariant + '" size="' + badgeSize + '"\n      onRemove={() => setVisible(false)} />\n  ) : null;\n}' : '\n<SkillChip label="React" variant="' + chipVariant + '" size="' + badgeSize + '" />'}`;
      break;
    case 'category-badge':
      controls = (
        <>
          <SelectControl
            label="Category"
            value={category}
            options={['캡스톤', '창의학기제', '동아리', '기타']}
            onChange={setCategory}
          />
          <SelectControl
            label="Size"
            value={badgeSize}
            options={['sm', 'md']}
            onChange={setBadgeSize}
          />
        </>
      );
      preview = <CategoryBadge label={category} size={badgeSize} />;
      example = `import CategoryBadge from '@/components/shared/CategoryBadge';\n\n<CategoryBadge label="${category}" size="${badgeSize}" />`;
      break;
    case 'status-badge':
      controls = (
        <>
          <SelectControl
            label="Status"
            value={status}
            options={['open', 'closed', 'deadline', 'suspended', 'completed', 'pending', 'leader']}
            onChange={setStatus}
          />
          <SelectControl
            label="Size"
            value={statusSize}
            options={['xs', 'sm', 'md']}
            onChange={setStatusSize}
          />
        </>
      );
      preview = (
        <div
          className={`flex items-center justify-center rounded-2xl p-8 ${status === 'deadline' ? 'bg-action-primary' : ''}`}
        >
          <StatusBadge status={status} size={statusSize} />
        </div>
      );
      example = `import StatusBadge from '@/components/shared/StatusBadge';\n\n${status === 'deadline' ? '<div className="bg-action-primary p-4">\n  ' : ''}<StatusBadge status="${status}" size="${statusSize}" />${status === 'deadline' ? '\n</div>' : ''}`;
      break;
    case 'avatar': {
      const sizeClass = { S: 'h-9 w-9', M: 'h-12 w-12', L: 'h-16 w-16' }[avatarSize] ?? 'h-12 w-12';
      controls = (
        <>
          <SelectControl
            label="Shape"
            value={shape}
            options={['circle', 'rounded']}
            onChange={setShape}
          />
          <SelectControl
            label="Size"
            value={avatarSize}
            options={['S', 'M', 'L']}
            onChange={setAvatarSize}
          />
        </>
      );
      preview = (
        <div className="flex items-center gap-3">
          <ProfileAvatar name="김미팀" shape={shape} sizeClassName={sizeClass} />
          <div>
            <p className="text-sm font-semibold">김미팀</p>
            <p className="mt-1 text-xs text-mt-text-secondary">프론트엔드 개발자</p>
          </div>
        </div>
      );
      example = `import ProfileAvatar from '@/components/shared/ProfileAvatar';\n\n<div className="flex items-center gap-3">\n  <ProfileAvatar name="김미팀" shape="${shape}" sizeClassName="${sizeClass}" />\n  <span>김미팀</span>\n</div>`;
      break;
    }
    case 'dialog':
      controls = (
        <p className="text-xs leading-6 text-mt-text-secondary">
          열기 버튼을 눌러 포커스 이동, Escape 닫기, 확인 동작을 확인해 보세요.
        </p>
      );
      preview = (
        <>
          <BaseButton onClick={() => setOpen(true)}>
            대화상자 열기
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </BaseButton>
          <ConfirmModal
            isOpen={open}
            title="새로운 팀을 만들어볼까요?"
            description="이 대화상자는 미리보기입니다. 확인하면 데모 알림이 표시돼요."
            confirmLabel="만들기"
            closeLabel="취소"
            onClose={() => setOpen(false)}
            onConfirm={() => {
              setOpen(false);
              showToast({
                tone: 'success',
                message: '확인 동작을 실행했어요. 실제 프로젝트는 생성되지 않아요.',
              });
            }}
          />
        </>
      );
      example = `import { useState } from 'react';\nimport BaseButton from '@/components/shared/BaseButton';\nimport ConfirmModal from '@/components/shared/ConfirmModal';\n\nfunction DialogExample() {\n  const [open, setOpen] = useState(false);\n  return (\n    <>\n      <BaseButton onClick={() => setOpen(true)}>대화상자 열기</BaseButton>\n      <ConfirmModal isOpen={open}\n        title="새로운 팀을 만들어볼까요?"\n        description="팀원 모집을 시작할 수 있어요."\n        confirmLabel="만들기" closeLabel="취소"\n        onClose={() => setOpen(false)}\n        onConfirm={() => setOpen(false)}\n      />\n    </>\n  );\n}`;
      break;
    case 'toast':
      controls = (
        <>
          <SelectControl
            label="Tone"
            value={tone}
            options={['success', 'error', 'info']}
            onChange={setTone}
          />
          <SelectControl
            label="Duration (ms)"
            value={duration}
            options={['2000', '4200', '8000']}
            onChange={setDuration}
          />
        </>
      );
      preview = (
        <div className="space-y-5 text-center">
          <div className="inline-flex items-center gap-2 rounded-xl border border-mt-border bg-mt-white px-4 py-3 text-sm text-mt-text-secondary shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-mt-mint" aria-hidden />
            알림은 화면 아래에 표시돼요.
          </div>
          <div>
            <BaseButton
              variant="gray"
              onClick={() =>
                showToast({
                  tone,
                  message: {
                    success: '변경 사항을 저장했어요.',
                    error: '저장하지 못했어요. 다시 시도해 주세요.',
                    info: '새로운 팀원이 합류했어요.',
                  }[tone],
                  durationMs: Number(duration),
                })
              }
            >
              토스트 띄우기
            </BaseButton>
          </div>
        </div>
      );
      example = `import BaseButton from '@/components/shared/BaseButton';\nimport { useToastStore } from '@/stores/useToastStore';\n\nfunction SaveFeedback() {\n  const showToast = useToastStore((state) => state.showToast);\n  return (\n    <BaseButton onClick={() => showToast({\n      tone: '${tone}',\n      message: '${{ success: '변경 사항을 저장했어요.', error: '저장하지 못했어요. 다시 시도해 주세요.', info: '새로운 팀원이 합류했어요.' }[tone]}',\n      durationMs: ${duration},\n    })}>토스트 띄우기</BaseButton>\n  );\n}`;
      break;
    case 'skeleton':
      controls = <ToggleControl label="Loading" checked={loading} onChange={setLoading} />;
      preview = (
        <div
          className="w-full max-w-xs rounded-2xl border border-mt-border bg-mt-white p-5"
          aria-busy={loading}
        >
          {loading ? (
            <>
              <span role="status" className="sr-only">
                프로필을 불러오는 중입니다.
              </span>
              <div className="flex items-center gap-3">
                <SkeletonBlock className="h-12 w-12 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-2/3" />
                  <SkeletonBlock className="h-3 w-full" />
                </div>
              </div>
              <SkeletonBlock className="mt-5 h-3 w-full" />
              <SkeletonBlock className="mt-2 h-3 w-4/5" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <ProfileAvatar name="김미팀" sizeClassName="h-12 w-12" />
                <div>
                  <p className="text-sm font-semibold">김미팀</p>
                  <p className="mt-1 text-xs text-mt-text-secondary">프론트엔드 개발자</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-mt-text-secondary">
                함께 배우고 성장할 팀원을 찾고 있어요.
              </p>
            </>
          )}
        </div>
      );
      example = `import SkeletonBlock from '@/components/shared/SkeletonBlock';\n\n<section aria-busy={${loading}}>\n${loading ? '  <span role="status" className="sr-only">불러오는 중입니다.</span>\n  <SkeletonBlock className="h-12 w-12 rounded-full" />\n  <SkeletonBlock className="mt-3 h-4 w-2/3" />\n  <SkeletonBlock className="mt-2 h-3 w-full" />' : '  <p>함께 배우고 성장할 팀원을 찾고 있어요.</p>'}\n</section>`;
      break;
  }

  const clientCode = `'use client';\n\n${example}`;
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-mt-border">
      <div className="flex items-center justify-between gap-2 border-b border-mt-border bg-mt-white px-4 py-3">
        <div className="flex gap-1" role="tablist" aria-label="예시 보기 방식">
          {(['preview', 'code'] as const).map((tab) => (
            <button
              key={tab}
              id={`${id}-${tab}-tab`}
              type="button"
              role="tab"
              aria-selected={view === tab}
              aria-controls={`${id}-${tab}-panel`}
              tabIndex={view === tab ? 0 : -1}
              onClick={() => setView(tab)}
              onKeyDown={(event) => {
                if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
                  event.preventDefault();
                  const next =
                    event.key === 'Home'
                      ? 'preview'
                      : event.key === 'End'
                        ? 'code'
                        : tab === 'preview'
                          ? 'code'
                          : 'preview';
                  setView(next);
                  document.getElementById(`${id}-${next}-tab`)?.focus();
                }
              }}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-action-primary ${view === tab ? 'bg-mt-bg-soft text-action-primary' : 'text-mt-text-secondary hover:bg-mt-bg-soft'}`}
            >
              {tab === 'preview' ? '미리보기' : '코드'}
            </button>
          ))}
        </div>
        <span className="hidden font-mono text-xs text-mt-text-secondary sm:block">{source}</span>
      </div>
      <div
        id={`${id}-preview-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-preview-tab`}
        hidden={view !== 'preview'}
      >
        <div className="grid md:grid-cols-3">
          <div className="ds-preview-grid flex min-h-80 min-w-0 items-center justify-center p-6 md:col-span-2 sm:p-8">
            {preview}
          </div>
          <div className="space-y-5 border-t border-mt-border bg-mt-white p-5 md:border-t-0 md:border-l">
            <p className="flex items-center gap-2 text-xs font-semibold text-mt-text-primary">
              <RotateCcw className="h-3.5 w-3.5 text-mt-text-secondary" aria-hidden />
              속성 바꿔보기
            </p>
            {controls}
            <p className="border-t border-mt-border pt-4 text-xs leading-5 text-mt-text-secondary">
              설정을 바꾸면 예시 코드도 함께 업데이트돼요.
            </p>
          </div>
        </div>
      </div>
      <div
        id={`${id}-code-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-code-tab`}
        hidden={view !== 'code'}
        className="p-4"
      >
        <CodeBlock code={clientCode} filename={`${source}.example.tsx`} />
      </div>
    </div>
  );
}
