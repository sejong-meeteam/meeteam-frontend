import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearApplicationDraft,
  readApplicationDraft,
  saveApplicationDraft,
} from '@/components/features/project/apply/applicationDraft';

function createMemoryStorage(): Storage {
  const items = new Map<string, string>();

  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => {
      items.delete(key);
    },
    setItem: (key, value) => {
      items.set(key, value);
    },
  };
}

const frontendDraft = { projectId: '102', jobPositionCode: 'WEB_FRONTEND' };

describe('applicationDraft', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('저장한 지원 메시지를 같은 프로젝트·포지션으로 돌아왔을 때 복원한다', () => {
    saveApplicationDraft(frontendDraft, '프로필을 고친 뒤 이어서 쓰려던 메시지입니다.');

    expect(readApplicationDraft(frontendDraft)).toBe(
      '프로필을 고친 뒤 이어서 쓰려던 메시지입니다.',
    );
  });

  it('다른 프로젝트나 포지션의 초안은 섞이지 않는다', () => {
    saveApplicationDraft(frontendDraft, '프론트엔드 지원 메시지입니다.');

    expect(readApplicationDraft({ ...frontendDraft, projectId: '103' })).toBe('');
    expect(readApplicationDraft({ ...frontendDraft, jobPositionCode: 'BACKEND' })).toBe('');
  });

  it('제출 후 초안을 지우면 다시 열었을 때 비어 있다', () => {
    saveApplicationDraft(frontendDraft, '제출할 지원 메시지입니다.');
    clearApplicationDraft(frontendDraft);

    expect(readApplicationDraft(frontendDraft)).toBe('');
  });

  it('공백만 남기면 초안을 지운다', () => {
    saveApplicationDraft(frontendDraft, '쓰다가 지운 메시지');
    saveApplicationDraft(frontendDraft, '   ');

    expect(sessionStorage.length).toBe(0);
  });

  it('sessionStorage를 쓸 수 없어도 오류 없이 빈 초안으로 동작한다', () => {
    vi.stubGlobal('sessionStorage', {
      ...createMemoryStorage(),
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
    });

    expect(() => saveApplicationDraft(frontendDraft, '저장 안 되는 메시지')).not.toThrow();
    expect(readApplicationDraft(frontendDraft)).toBe('');
  });
});
