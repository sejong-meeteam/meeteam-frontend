import type { ProjectCategoryId, ReleasePlatform } from '@/types/project';

export const PROJECT_CATEGORIES: Array<{
  id: ProjectCategoryId;
  label: string;
  icon: string;
}> = [
  { id: 'capstone', label: '캡스톤', icon: '🎓' },
  { id: 'creative-semester', label: '창의학기제', icon: '💡' },
  { id: 'club', label: '동아리', icon: '🏛️' },
  { id: 'other', label: '기타', icon: '✨' },
];

export const RELEASE_PLATFORMS: ReleasePlatform[] = ['웹', 'iOS', '안드로이드'];

export const FINDER_PLATFORM_OPTIONS: Array<ReleasePlatform | '전체'> = [
  '전체',
  ...RELEASE_PLATFORMS,
];

export const FINDER_CATEGORY_OPTIONS = [
  '모든 카테고리',
  ...PROJECT_CATEGORIES.map((item) => item.label),
];

export function getProjectCategoryLabel(categoryId: ProjectCategoryId | '') {
  return PROJECT_CATEGORIES.find((category) => category.id === categoryId)?.label ?? '기타';
}
