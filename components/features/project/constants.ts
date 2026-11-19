import type { ProjectCategoryCode, ProjectCategoryId, ReleasePlatform } from '@/types/project';

export const PROJECT_CATEGORIES = [
  { id: 'capstone', code: 'CAPSTONE', label: '캡스톤', icon: '🎓' },
  { id: 'creative-semester', code: 'CREATIVE_SEMESTER', label: '창의학기제', icon: '💡' },
  { id: 'club', code: 'CLUB', label: '동아리', icon: '🏛️' },
  { id: 'study', code: 'STUDY', label: '스터디', icon: '📚' },
  { id: 'contest', code: 'CONTEST', label: '공모전', icon: '🏆' },
  { id: 'other', code: 'ETC', label: '기타', icon: '✨' },
] as const satisfies ReadonlyArray<{
  id: ProjectCategoryId;
  code: ProjectCategoryCode;
  label: string;
  icon: string;
}>;

export type ProjectCategoryLabel = (typeof PROJECT_CATEGORIES)[number]['label'];

export const PROJECT_CATEGORY_CODES = PROJECT_CATEGORIES.map((category) => category.code);

export const RELEASE_PLATFORMS: ReleasePlatform[] = ['웹', 'iOS', '안드로이드'];

export const FINDER_PLATFORM_OPTIONS: Array<ReleasePlatform | '전체'> = [
  '전체',
  ...RELEASE_PLATFORMS,
];

export const FINDER_CATEGORY_OPTIONS = [
  '모든 카테고리',
  ...PROJECT_CATEGORIES.map((item) => item.label),
] as const;

export function getProjectCategoryLabel(categoryId: ProjectCategoryId | '') {
  return PROJECT_CATEGORIES.find((category) => category.id === categoryId)?.label ?? '기타';
}

export function findProjectCategoryByCode(code: string) {
  return PROJECT_CATEGORIES.find((category) => category.code === code);
}

export function findProjectCategoryByLabel(label: string) {
  return PROJECT_CATEGORIES.find((category) => category.label === label);
}
