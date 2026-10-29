export type ComponentCategory = 'Actions' | 'Inputs' | 'Display' | 'Feedback';

export type PropDefinition = {
  name: string;
  type: string;
  defaultValue: string;
  description: string;
};

export type ComponentDefinition = {
  id: string;
  name: string;
  koreanName: string;
  category: ComponentCategory;
  description: string;
  source: string;
  story: string;
  anatomy: string[];
  guidelines: string[];
  accessibility: string[];
  props: PropDefinition[];
};

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  Actions: '액션',
  Inputs: '입력과 선택',
  Display: '정보 표시',
  Feedback: '피드백',
};

export const COMPONENTS: ComponentDefinition[] = [
  {
    id: 'button',
    name: 'Button',
    koreanName: '버튼',
    category: 'Actions',
    description: '다음 행동을 명확하게 안내하는 가장 기본적인 액션 컴포넌트입니다.',
    source: 'BaseButton',
    story: 'shared-button--primary',
    anatomy: ['Container', 'Label', 'Icon (선택)'],
    guidelines: [
      'Primary는 화면에서 가장 중요한 행동에 사용합니다. 보조 행동에는 gray를 사용하세요.',
      '“확인”보다 “프로젝트 만들기”처럼 결과를 예상할 수 있는 동사를 사용하세요.',
      '폼 제출에는 type="submit"을 명시하고, 처리 중에는 disabled로 중복 요청을 막으세요.',
    ],
    accessibility: [
      '아이콘만 넣는 버튼에는 aria-label로 동작을 설명하세요.',
      'Tab으로 이동하고 Enter 또는 Space로 실행할 수 있습니다. 비활성 버튼은 포커스 순서에서 제외됩니다.',
    ],
    props: [
      {
        name: 'size',
        type: "'XL' | 'L' | 'M' | 'S' | 'XS'",
        defaultValue: "'M'",
        description: '버튼 높이와 텍스트 크기',
      },
      {
        name: 'variant',
        type: "'primary' | 'gray'",
        defaultValue: "'primary'",
        description: '액션의 시각적 위계',
      },
      {
        name: 'full',
        type: 'boolean',
        defaultValue: 'false',
        description: '부모의 전체 너비 사용',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: '상호작용 비활성화',
      },
      {
        name: 'children',
        type: 'ReactNode',
        defaultValue: '필수',
        description: '텍스트 또는 아이콘',
      },
    ],
  },
  {
    id: 'input',
    name: 'Text Input',
    koreanName: '텍스트 입력',
    category: 'Inputs',
    description: '짧은 텍스트를 입력받고 입력 상태를 명확하게 전달합니다.',
    source: 'BaseInput',
    story: 'shared-form--text-fields',
    anatomy: ['Container', 'Input', 'Prefix / Suffix (선택)'],
    guidelines: [
      'BaseField와 조합해 항상 입력 목적을 보여주는 레이블을 제공하세요.',
      'Placeholder는 예시를 전달하는 용도로 사용하고 레이블을 대신하지 않도록 합니다.',
      '오류의 원인과 해결 방법을 입력창 바로 아래에 안내하세요.',
    ],
    accessibility: [
      '레이블의 htmlFor와 입력창의 id를 연결하세요.',
      '오류에는 error와 aria-describedby를 함께 지정해 오류 설명을 연결하세요.',
    ],
    props: [
      {
        name: 'inputSize',
        type: "'L' | 'M' | 'S'",
        defaultValue: "'M'",
        description: '입력창 여백과 텍스트 크기',
      },
      {
        name: 'error',
        type: 'boolean',
        defaultValue: 'false',
        description: '오류 스타일과 aria-invalid 적용',
      },
      {
        name: 'leftIcon / rightIcon',
        type: 'ReactNode',
        defaultValue: '—',
        description: '입력창 양 끝의 장식 요소',
      },
      { name: 'full', type: 'boolean', defaultValue: 'true', description: '부모의 전체 너비 사용' },
      {
        name: '...props',
        type: 'InputHTMLAttributes',
        defaultValue: '—',
        description: 'id, type, disabled, readOnly 등 네이티브 속성',
      },
    ],
  },
  {
    id: 'textarea',
    name: 'Textarea',
    koreanName: '여러 줄 입력',
    category: 'Inputs',
    description: '프로젝트 소개나 지원 동기처럼 긴 내용을 입력받습니다.',
    source: 'BaseTextarea',
    story: 'shared-form--text-fields',
    anatomy: ['Container', 'Textarea', 'Resize handle'],
    guidelines: [
      '입력할 내용의 분량을 예상해 rows를 설정하세요. 사용자가 세로 높이를 조절할 수 있습니다.',
      '글자 수를 제한할 때는 maxLength와 함께 제한을 설명하는 안내를 제공하세요.',
    ],
    accessibility: [
      'BaseField의 레이블과 id를 연결하세요.',
      '안내 문구는 aria-describedby로 연결하고, 오류가 있으면 aria-invalid를 명시하세요.',
    ],
    props: [
      {
        name: 'textareaSize',
        type: "'L' | 'M' | 'S'",
        defaultValue: "'M'",
        description: '안쪽 여백과 텍스트 크기',
      },
      {
        name: 'rows',
        type: 'number',
        defaultValue: '4',
        description: '기본 표시 줄 수 (최소 높이 적용)',
      },
      { name: 'full', type: 'boolean', defaultValue: 'true', description: '부모의 전체 너비 사용' },
      {
        name: '...props',
        type: 'TextareaHTMLAttributes',
        defaultValue: '—',
        description: 'disabled, readOnly, maxLength, ref 등',
      },
    ],
  },
  {
    id: 'field',
    name: 'Field',
    koreanName: '폼 필드',
    category: 'Inputs',
    description: '레이블, 입력 요소, 도움말을 일관된 구조로 묶습니다.',
    source: 'BaseField',
    story: 'shared-form--error-state',
    anatomy: ['Label', 'Control', 'Hint / Error'],
    guidelines: [
      '한 필드에는 하나의 입력 목적만 담으세요.',
      '선택 항목에는 required={false}를 설정합니다. 실제 필수 검증은 입력 요소와 스키마에서 처리하세요.',
      'errorText가 있으면 hintText 대신 오류가 표시됩니다.',
    ],
    accessibility: [
      'htmlFor를 지정하면 안내와 오류에 각각 {id}-hint, {id}-error가 생성됩니다. 입력 요소의 aria-describedby에 연결하세요.',
      'required는 레이블 표시만 제어합니다. 네이티브 required 속성은 입력 요소에 직접 지정하세요.',
    ],
    props: [
      {
        name: 'label',
        type: 'string',
        defaultValue: '—',
        description: '입력 목적을 설명하는 레이블',
      },
      {
        name: 'htmlFor',
        type: 'string',
        defaultValue: '—',
        description: '입력 요소 id 및 안내 문구 id의 기준',
      },
      {
        name: 'required',
        type: 'boolean',
        defaultValue: 'true',
        description: 'false일 때 “(선택)” 표시',
      },
      {
        name: 'hintText / errorText',
        type: 'string',
        defaultValue: '—',
        description: '도움말 또는 우선 표시할 오류 메시지',
      },
      { name: 'children', type: 'ReactNode', defaultValue: '—', description: '입력 컨트롤' },
    ],
  },
  {
    id: 'dropdown',
    name: 'Dropdown',
    koreanName: '드롭다운',
    category: 'Inputs',
    description: '정해진 목록에서 하나의 값을 선택합니다.',
    source: 'BaseDropdown',
    story: 'shared-form--dropdown',
    anatomy: ['Trigger', 'Label', 'Chevron', 'SelectMenu'],
    guidelines: [
      'open과 value를 부모에서 관리하는 제어형 컴포넌트입니다.',
      '선택한 뒤 onSelect에서 값을 저장하고 메뉴를 닫으세요.',
      '긴 목록이나 다중 선택에는 목적에 맞는 별도 선택 UI를 사용하세요.',
    ],
    accessibility: [
      '버튼의 aria-expanded와 aria-controls로 펼침 상태가 전달됩니다.',
      'Tab으로 옵션을 이동하고 Enter 또는 Space로 선택합니다. Escape와 바깥 클릭으로 닫을 수 있습니다.',
    ],
    props: [
      {
        name: 'items',
        type: 'string[]',
        defaultValue: '필수',
        description: '중복되지 않는 선택 항목',
      },
      {
        name: 'placeholder',
        type: 'string',
        defaultValue: '필수',
        description: '선택 전 표시할 안내',
      },
      {
        name: 'value / open',
        type: 'string / boolean',
        defaultValue: '— / 필수',
        description: '선택값과 펼침 상태',
      },
      {
        name: 'onToggle / onSelect',
        type: '() => void / (value: string) => void',
        defaultValue: '필수',
        description: '열림 토글과 선택 이벤트',
      },
      { name: 'disabled', type: 'boolean', defaultValue: 'false', description: '선택 비활성화' },
    ],
  },
  {
    id: 'tag',
    name: 'Tag',
    koreanName: '태그',
    category: 'Inputs',
    description: '관심사나 필터의 선택 여부를 간결하게 표현합니다.',
    source: 'BaseTag',
    story: 'shared-form--tags',
    anatomy: ['Container', 'Label', 'Leading / Trailing icon (선택)'],
    guidelines: [
      'selected로 선택 상태를 표현하고 여러 태그 사이에 일정한 간격을 유지하세요.',
      '정보만 표시할 때는 Badge를 사용하고, 선택 가능한 필터에는 명확한 선택 상태를 제공하세요.',
    ],
    accessibility: [
      'BaseTag는 span을 렌더링합니다. 선택 동작이 필요하면 button으로 감싸고 aria-pressed를 지정하세요.',
      '색상 외에도 체크 아이콘처럼 선택 여부를 구분할 수 있는 단서를 함께 제공하세요.',
    ],
    props: [
      { name: 'size', type: "'L' | 'M' | 'S'", defaultValue: "'M'", description: '태그 크기' },
      { name: 'selected', type: 'boolean', defaultValue: 'false', description: '선택 상태 스타일' },
      {
        name: 'leftIcon / rightIcon',
        type: 'ReactNode',
        defaultValue: '—',
        description: '레이블 앞뒤 아이콘',
      },
    ],
  },
  {
    id: 'skill-chip',
    name: 'Skill Chip',
    koreanName: '기술 스택 칩',
    category: 'Display',
    description: '기술 아이콘과 이름을 함께 보여주고 선택적으로 삭제할 수 있습니다.',
    source: 'SkillChip',
    story: 'shared-display--skills',
    anatomy: ['TechStackIcon', 'Label', 'Remove button (선택)'],
    guidelines: [
      '프로젝트 모집 기술이나 프로필의 기술 스택에 사용하세요.',
      '사용자가 편집할 수 있는 목록에서만 onRemove를 제공하세요.',
    ],
    accessibility: [
      '삭제 버튼에는 기술 이름을 포함한 접근 가능한 레이블이 자동으로 적용됩니다.',
      '삭제 후 주변 항목이나 복원 버튼으로 포커스를 이동할 수 있게 구성하세요.',
    ],
    props: [
      { name: 'label', type: 'string', defaultValue: '필수', description: '기술 스택 이름' },
      {
        name: 'variant',
        type: "'primary' | 'neutral' | 'outline'",
        defaultValue: "'neutral'",
        description: '칩의 강조 방식',
      },
      { name: 'size', type: "'sm' | 'md'", defaultValue: "'sm'", description: '칩 크기' },
      {
        name: 'onRemove',
        type: '() => void',
        defaultValue: '—',
        description: '제공하면 삭제 버튼 표시',
      },
    ],
  },
  {
    id: 'category-badge',
    name: 'Category Badge',
    koreanName: '카테고리 배지',
    category: 'Display',
    description: '프로젝트 유형을 고유한 색과 레이블로 구분합니다.',
    source: 'CategoryBadge',
    story: 'shared-display--categories',
    anatomy: ['Container', 'Label'],
    guidelines: [
      '캡스톤, 창의학기제, 동아리, 기타에는 지정된 카테고리 토큰이 적용됩니다.',
      '정의된 네 가지 레이블의 색은 tone보다 우선합니다. 다른 레이블에서만 tone이 적용됩니다.',
    ],
    accessibility: [
      '배지는 상태를 설명하는 텍스트입니다. 클릭 가능한 버튼처럼 사용하지 마세요.',
      '배경과 텍스트의 대비를 실제 사용 배경에서 확인하세요.',
    ],
    props: [
      { name: 'label', type: 'string', defaultValue: '필수', description: '프로젝트 유형' },
      {
        name: 'tone',
        type: "'default' | 'onDark' | 'accent'",
        defaultValue: "'default'",
        description: '등록되지 않은 레이블의 배경 대응',
      },
      { name: 'size', type: "'sm' | 'md'", defaultValue: "'sm'", description: '배지 크기' },
    ],
  },
  {
    id: 'status-badge',
    name: 'Status Badge',
    koreanName: '상태 배지',
    category: 'Display',
    description: '모집 상태와 역할을 일관된 시각 언어로 전달합니다.',
    source: 'StatusBadge',
    story: 'foundation--status',
    anatomy: ['Container', 'Icon (선택)', 'Label'],
    guidelines: [
      '모집중, 마감, 대기 등 실제 데이터의 상태와 일치하는 status를 지정하세요.',
      'deadline은 어두운 이미지 위에 올리는 반투명 스타일입니다. 밝은 배경에는 closed를 사용하세요.',
    ],
    accessibility: [
      '색상만으로 상태를 구분하지 않도록 기본 레이블을 유지하세요.',
      '중요한 상태 변경은 별도 라이브 영역으로 알릴 수 있습니다. 배지 자체는 라이브 영역이 아닙니다.',
    ],
    props: [
      {
        name: 'status',
        type: "'open' | 'closed' | 'deadline' | 'suspended' | 'completed' | 'pending' | 'leader'",
        defaultValue: '필수',
        description: '상태별 스타일과 기본 문구',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: '상태별 기본값',
        description: '기본 레이블 덮어쓰기',
      },
      { name: 'size', type: "'xs' | 'sm' | 'md'", defaultValue: "'xs'", description: '배지 크기' },
      { name: 'icon', type: 'ReactNode', defaultValue: '—', description: '레이블 앞 아이콘' },
    ],
  },
  {
    id: 'avatar',
    name: 'Avatar',
    koreanName: '아바타',
    category: 'Display',
    description: '사용자 이미지를 표시하고 이미지가 없으면 이름의 첫 글자를 보여줍니다.',
    source: 'ProfileAvatar',
    story: 'shared-display--avatars',
    anatomy: ['Container', 'Image / Initial'],
    guidelines: [
      '사람을 나타낼 때는 circle, 카드형 이미지에는 rounded를 사용하세요.',
      '이미지 URL이 없거나 로딩에 실패하면 자동으로 이름 첫 글자로 대체됩니다.',
    ],
    accessibility: [
      '아바타는 aria-hidden 처리됩니다. 옆에 사용자 이름을 텍스트로 제공하세요.',
      '아바타만 있는 링크나 버튼에는 별도의 aria-label이 필요합니다.',
    ],
    props: [
      {
        name: 'name',
        type: 'string',
        defaultValue: '필수',
        description: '이미지 대체 이니셜에 사용할 이름',
      },
      {
        name: 'imageUrl',
        type: 'string | null',
        defaultValue: '—',
        description: '프로필 이미지 URL',
      },
      {
        name: 'shape',
        type: "'circle' | 'rounded'",
        defaultValue: "'circle'",
        description: '이미지 모서리 형태',
      },
      {
        name: 'sizeClassName',
        type: 'string',
        defaultValue: "'h-9 w-9'",
        description: 'Tailwind 너비와 높이',
      },
      {
        name: 'textClassName',
        type: 'string',
        defaultValue: "'text-base'",
        description: '대체 이니셜의 글자 크기',
      },
    ],
  },
  {
    id: 'dialog',
    name: 'Dialog',
    koreanName: '확인 대화상자',
    category: 'Feedback',
    description: '작업을 계속하기 전에 필요한 확인과 선택에 집중하도록 돕습니다.',
    source: 'ConfirmModal',
    story: 'shared-feedback--confirmation',
    anatomy: ['BaseModal / Backdrop', 'Title', 'Description', 'Actions'],
    guidelines: [
      '중요한 결정을 확인할 때 사용하고 단순한 안내는 Toast를 사용하세요.',
      '제목은 질문으로, 액션은 실행 결과를 알 수 있는 문구로 작성하세요.',
      '비동기 요청에는 isSubmitting을 연결합니다. 이때 닫기와 확인이 비활성화됩니다.',
    ],
    accessibility: [
      'BaseModal이 포커스 이동과 가두기, Escape 닫기, 닫힌 뒤 포커스 복원을 처리합니다.',
      'title과 description은 대화상자의 접근 가능한 이름과 설명으로 자동 연결됩니다.',
    ],
    props: [
      { name: 'isOpen', type: 'boolean', defaultValue: '필수', description: '대화상자 표시 여부' },
      {
        name: 'title / description',
        type: 'string / ReactNode',
        defaultValue: '필수',
        description: '제목과 설명',
      },
      {
        name: 'confirmLabel / closeLabel',
        type: 'string',
        defaultValue: "필수 / '닫기'",
        description: '확인과 닫기 버튼 문구',
      },
      {
        name: 'onConfirm / onClose',
        type: '() => void | Promise<void> / () => void',
        defaultValue: '필수',
        description: '확인과 닫기 핸들러',
      },
      {
        name: 'isSubmitting / isConfirmDisabled',
        type: 'boolean',
        defaultValue: 'false',
        description: '처리 중 상태와 확인 비활성화',
      },
    ],
  },
  {
    id: 'toast',
    name: 'Toast',
    koreanName: '토스트 알림',
    category: 'Feedback',
    description: '흐름을 방해하지 않고 작업 결과를 짧게 알려줍니다.',
    source: 'ToastViewport',
    story: 'shared-feedback--toast',
    anatomy: ['Status icon', 'Message', 'Dismiss button'],
    guidelines: [
      '앱 루트에 있는 ToastViewport가 알림을 표시합니다. 중복으로 마운트하지 마세요.',
      'useToastStore의 showToast를 호출해 사용합니다. 동시에 최대 3개를 표시합니다.',
      '긴 설명이나 사용자의 판단이 필요한 내용에는 대화상자를 사용하세요.',
    ],
    accessibility: [
      'role="status"로 알림이 전달되며 사용자 포커스를 이동시키지 않습니다.',
      '자동 닫힘 시간은 durationMs로 조정할 수 있고 닫기 버튼으로 즉시 닫을 수 있습니다.',
    ],
    props: [
      {
        name: 'message',
        type: 'string',
        defaultValue: '필수',
        description: 'showToast에 전달할 메시지',
      },
      {
        name: 'tone',
        type: "'success' | 'error' | 'info'",
        defaultValue: "'error'",
        description: '알림 유형',
      },
      {
        name: 'durationMs',
        type: 'number',
        defaultValue: '4200',
        description: '자동 닫힘 시간 (밀리초)',
      },
    ],
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    koreanName: '로딩 자리표시자',
    category: 'Feedback',
    description: '콘텐츠를 불러오는 동안 완성될 레이아웃을 미리 보여줍니다.',
    source: 'SkeletonBlock',
    story: 'shared-feedback--skeleton',
    anatomy: ['Placeholder blocks', 'Loading container'],
    guidelines: [
      '실제 콘텐츠와 비슷한 형태와 크기로 구성해 레이아웃 이동을 줄이세요.',
      '완료되면 실제 콘텐츠로 교체하고 로딩 실패에는 재시도 방법을 안내하세요.',
    ],
    accessibility: [
      'SkeletonBlock은 aria-hidden 처리됩니다. 상위 영역에 aria-busy와 별도의 로딩 안내를 제공하세요.',
      '움직임 감소 설정에서는 맥동 애니메이션을 끄세요.',
    ],
    props: [
      {
        name: 'className',
        type: 'string',
        defaultValue: "''",
        description: '블록의 너비와 높이를 지정하는 Tailwind 클래스',
      },
    ],
  },
];

export const FOUNDATIONS = [
  { id: 'colors', name: 'Color', koreanName: '컬러', description: '역할을 담은 컬러 토큰' },
  {
    id: 'typography',
    name: 'Typography',
    koreanName: '타이포그래피',
    description: '읽기 편한 정보의 위계',
  },
  {
    id: 'spacing',
    name: 'Spacing & Shape',
    koreanName: '간격과 형태',
    description: '일관된 화면의 리듬',
  },
  { id: 'icons', name: 'Iconography', koreanName: '아이콘', description: '직관적인 시각 언어' },
] as const;
