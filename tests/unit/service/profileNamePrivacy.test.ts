import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateMyProfile } from '@/components/features/profile/profileApi';

const profile = {
  name: '학교확인이름',
  age: 24,
  gender: 'MALE' as const,
  jobPositionIds: [1],
  techStacks: [{ id: 1, displayOrder: 1 }],
  isParticipating: true,
};

afterEach(() => vi.unstubAllGlobals());

describe('프로필 이름 공개 설정 요청', () => {
  it.each([true, false, null, undefined])(
    '기존 필수 항목을 유지하고 namePrivate=%s를 선택적으로 전송한다',
    async (namePrivate) => {
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          Response.json({ result: { memberId: 1, name: profile.name, namePrivate } }),
        );
      vi.stubGlobal('fetch', fetchMock);

      await updateMyProfile({ ...profile, namePrivate });

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/members/me',
        expect.objectContaining({ method: 'PUT', body: expect.any(FormData) }),
      );
      const body = fetchMock.mock.calls[0][1]?.body as FormData;
      const part = body.get('memberInfo') as Blob;
      expect(part.type).toBe('application/json');
      const json = JSON.parse(await part.text());
      expect(json).toMatchObject(profile);
      if (namePrivate === undefined) expect(json).not.toHaveProperty('namePrivate');
      else expect(json.namePrivate).toBe(namePrivate);
    },
  );

  it.each([false, undefined])(
    'rejects an unconfirmed save when PUT returns %s',
    async (namePrivate) => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(Response.json({ result: { memberId: 1, namePrivate } })),
      );

      await expect(updateMyProfile({ ...profile, namePrivate: true })).rejects.toThrow(
        '이름 비공개 설정이 반영되지 않았습니다.',
      );
    },
  );
});
